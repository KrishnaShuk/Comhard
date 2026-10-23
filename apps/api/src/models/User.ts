import { Schema, model, type HydratedDocument } from "mongoose";

export interface UserFields {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserFields>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true, versionKey: false },
);

export type UserDocument = HydratedDocument<UserFields>;
export const UserModel = model<UserFields>("User", userSchema);
