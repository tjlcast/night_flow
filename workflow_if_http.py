import json
import requests
from typing import Dict, Any

class WorkflowExecutor:
    def __init__(self, workflow_json: str):
        self.workflow = json.loads(workflow_json)
        self.context = self.workflow.get('context', {})
        self.variables = self.context.get('vars', {})
        self.secrets = self.context.get('secrets', {})
        
    def evaluate_condition(self, condition: Dict[str, Any]) -> bool:
        operator = condition['operator']
        
        if operator in ('and', 'or'):
            results = [self.evaluate_condition(c) for c in condition['conditions']]
            if operator == 'and':
                return all(results)
            else:
                return any(results)
        elif operator == 'not':
            return not self.evaluate_condition(condition['conditions'][0])
        else:
            left = self.resolve_value(condition['left'], self.context)
            right = self.resolve_value(condition['right'], self.context)
            
            if operator == '>':
                return left > right
            elif operator == '<':
                return left < right
            elif operator == '==':
                return left == right
            elif operator == '!=':
                return left != right
            elif operator == '>=':
                return left >= right
            elif operator == '<=':
                return left <= right
            else:
                raise ValueError(f"Unknown operator: {operator}")
    
    def resolve_value(self, value: Any, context) -> Any:
        if isinstance(value, str) and value.startswith('${') and value.endswith('}'):
            path = value[2:-1].split('.')[1:]
            current = context
            for part in path:
                if part in current:
                    current = current[part]
                else:
                    raise ValueError(f"Could not resolve path: {value}")
            return current
        return value
    
    def execute_http(self, step: Dict[str, Any]) -> Any:
        method = step['method'].upper()
        url = self.resolve_value(step['url'], self.context)
        headers = {k: self.resolve_value(v, self.context) for k, v in step.get('headers', {}).items()}
        body = step.get('body')
        
        if body is not None:
            if isinstance(body, (dict, list)):
                body = json.dumps(body)
            body = str(body)
        
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            data=body
        )
        
        try:
            response_data = response.json()
        except ValueError:
            response_data = response.text
        
        if 'output' in step:
            self.variables[step['output']] = response_data
        
        return response_data
    
    def execute_log(self, step: Dict[str, Any]):
        message = self.resolve_value(step['message'], self.context)
        print(f"[LOG] {message}")
    
    def execute_step(self, step: Dict[str, Any]):
        step_type = step['type']
        
        if step_type == 'if':
            if self.evaluate_condition(step['condition']):
                for s in step.get('true_steps', []):
                    self.execute_step(s)
            else:
                for s in step.get('false_steps', []):
                    self.execute_step(s)
        elif step_type == 'http':
            return self.execute_http(step)
        elif step_type == 'log':
            return self.execute_log(step)
        else:
            raise ValueError(f"Unknown step type: {step_type}")
    
    def execute(self):
        for step in self.workflow['workflow']['steps']:
            self.execute_step(step)
        
        return {
            'variables': self.variables,
            'secrets': self.secrets
        }

# 使用示例
if __name__ == "__main__":
    workflow_json = """
    {
      "workflow": {
        "name": "sample_workflow",
        "steps": [
          {
            "type": "if",
            "condition": {
              "operator": "and",
              "conditions": [
                {
                  "left": "${context.vars.temperature}",
                  "operator": ">",
                  "right": 30
                },
                {
                  "left": "${context.vars.humidity}",
                  "operator": "<",
                  "right": 60
                }
              ]
            },
            "true_steps": [
              {
                "type": "http",
                "name": "send_alert",
                "method": "POST",
                "url": "https://httpbin.org/post",
                "headers": {
                  "Content-Type": "application/json"
                },
                "body": {
                  "message": "High temperature alert",
                  "value": "${context.vars.temperature}"
                },
                "output": "alert_response"
              }
            ],
            "false_steps": [
              {
                "type": "log",
                "message": "Conditions not met"
              }
            ]
          },
          {
            "type": "http",
            "name": "fetch_data",
            "method": "GET",
            "url": "https://httpbin.org/get",
            "headers": {
              "Accept": "application/json"
            },
            "output": "api_response"
          }
        ]
      },
      "context": {
        "vars": {
          "temperature": 32,
          "humidity": 55
        },
        "secrets": {
          "api_key": "abc123"
        }
      }
    }
    """
    
    executor = WorkflowExecutor(workflow_json)
    result = executor.execute()
    print("\nFinal variables:")
    print(json.dumps(result['variables'], indent=2))