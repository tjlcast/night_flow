// Simple unique ID generator
export const nanoid = () => {
  return Math.random().toString(36).substring(2, 10);
};
