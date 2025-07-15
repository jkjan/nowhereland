export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.error("Error hashing password:", error);
      throw new Error("Failed to hash password");
    }
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const hashedAttempt = await this.hashPassword(password);
      return hashedAttempt === hashedPassword;
    } catch (error) {
      console.error("Error verifying password:", error);
      return false;
    }
  }
}