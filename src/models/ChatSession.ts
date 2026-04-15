import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  source?: string;
  intent?: string;
}

export interface IFeedback {
  messageIndex: number;
  rating: 'up' | 'down';
  createdAt: Date;
}

export interface IChatSession extends Document {
  sessionId: string;
  leadId?: mongoose.Types.ObjectId;
  visitorName?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  messages: IChatMessage[];
  metadata: {
    userAgent?: string;
    startedAt: Date;
    endedAt?: Date;
    totalMessages: number;
    totalUserMessages: number;
    totalBotMessages: number;
  };
  feedback: IFeedback[];
  topics: string[];
  status: 'active' | 'completed';
  adminNotes?: string;
  flagged?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSessionSchema: Schema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    visitorName: { type: String, default: '' },
    visitorPhone: { type: String, default: '' },
    visitorEmail: { type: String, default: '' },
    messages: [
      {
        role: { type: String, enum: ['user', 'bot'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        source: { type: String, default: '' },
        intent: { type: String, default: '' },
      },
    ],
    metadata: {
      userAgent: { type: String, default: '' },
      startedAt: { type: Date, default: Date.now },
      endedAt: { type: Date, default: null },
      totalMessages: { type: Number, default: 0 },
      totalUserMessages: { type: Number, default: 0 },
      totalBotMessages: { type: Number, default: 0 },
    },
    feedback: [
      {
        messageIndex: { type: Number, required: true },
        rating: { type: String, enum: ['up', 'down'], required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    topics: [{ type: String }],
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },
    adminNotes: { type: String, default: '' },
    flagged: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Indexes for analytics queries
ChatSessionSchema.index({ createdAt: -1 });
ChatSessionSchema.index({ status: 1, createdAt: -1 });
ChatSessionSchema.index({ 'metadata.totalMessages': -1 });

const ChatSession =
  mongoose.models.ChatSession ||
  mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);

export default ChatSession;
