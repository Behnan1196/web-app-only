export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'coach';
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  text: string;
  user: {
    id: string;
    name: string;
    role: 'student' | 'coach';
  };
  created_at: string;
}

export interface ChatChannel {
  id: string;
  type: string;
  members: User[];
  last_message?: Message;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  student_id: string;
  coach_id: string;
  created_at: string;
  student?: User;
  coach?: User;
}
