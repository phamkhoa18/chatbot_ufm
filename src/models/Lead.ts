import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  fullName: string;
  email: string;
  phone: string;
  source: string;
  chatHistory: { role: string; content: string }[];
  aiAnalysis: {
    isPotential: boolean;
    score: number;
    summary: string;
    interestedPrograms: string[];
  };
  status: 'New' | 'Contacted' | 'Enrolled' | 'Junk';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema: Schema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      default: 'AI_Chatbot',
    },
    chatHistory: [
      {
        role: { type: String, enum: ['user', 'assistant', 'system'] },
        content: { type: String },
      },
    ],
    aiAnalysis: {
      isPotential: { type: Boolean, default: false },
      score: { type: Number, min: 0, max: 10, default: 0 },
      summary: { type: String },
      interestedPrograms: [{ type: String }],
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Enrolled', 'Junk'],
      default: 'New',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Lead = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
