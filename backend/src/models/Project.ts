import mongoose, { Document, Schema } from 'mongoose';

export type ProjectStatus = 'active' | 'on_hold' | 'completed' | 'archived';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: ProjectStatus;
  color: string;
  startDate?: Date;
  endDate?: Date;
  ownerId: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const projectColors = [
  '#8b5cf6', '#10b981', '#f59e0b', '#ec4899',
  '#06b6d4', '#ef4444', '#f97316', '#3b82f6',
];

const projectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'on_hold', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    color: {
      type: String,
      default: () => projectColors[Math.floor(Math.random() * projectColors.length)],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    memberIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for owner + status filtering
projectSchema.index({ ownerId: 1, status: 1 });
projectSchema.index({ title: 'text', description: 'text' });

export const Project = mongoose.model<IProject>('Project', projectSchema);
