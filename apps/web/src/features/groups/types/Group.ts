// Define the structure for an Interest tag
interface Interest {
  _id: string;
  name: string;
}

// Define the structure for a Group, matching the final Backend schema
export interface Group {
  _id: string;
  name: string;
  description: string;
  owner: string; // ID of the user who owns the group
  interests: Interest[];
}
