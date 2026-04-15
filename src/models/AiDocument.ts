import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IAiDocument extends Document {
  fileName: string
  status: 'active' | 'processing' | 'error' | 'deleted'
  programLevel?: string
  programName?: string
  academicYear?: string
  referenceUrl?: string
  chunksCount: number
  fileSize: number
  fastApiTaskId?: string
  fastApiTaskStatus?: string
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

const aiDocumentSchema = new Schema<IAiDocument>(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'processing', 'error', 'deleted'],
      default: 'processing',
    },
    programLevel: {
      type: String,
      enum: ['thac_si', 'tien_si', 'dai_hoc', 'chung', ''],
      default: '',
    },
    programName: {
      type: String,
      trim: true,
    },
    academicYear: {
      type: String,
      trim: true,
    },
    referenceUrl: {
      type: String,
      trim: true,
    },
    chunksCount: {
      type: Number,
      default: 0,
    },
    fileSize: {
      type: Number,
      default: 0, // bytes
    },
    fastApiTaskId: {
      type: String,
    },
    fastApiTaskStatus: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: 'aidocuments',
  }
)

// Force completely new model compilation to bypass Node.js memory cache
const AiDocument: Model<IAiDocument> = mongoose.models.AiDocumentFresh || mongoose.model<IAiDocument>('AiDocumentFresh', aiDocumentSchema)

export default AiDocument
