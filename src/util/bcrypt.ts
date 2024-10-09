const bcrypt = require('bcrypt');

const randomNumber = (max: number, min: number) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = randomNumber(16, 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
};

// Function to compare a password with its hash
export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};