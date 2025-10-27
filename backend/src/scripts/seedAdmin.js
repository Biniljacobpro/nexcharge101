import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import User from '../models/user.model.js';

// load env from backend/.env or project root
const backendEnv = path.resolve(process.cwd(), '../.env');
if (fs.existsSync(backendEnv)) {
	const content = fs.readFileSync(backendEnv, 'utf8');
	content.split('\n').forEach((line) => {
		const m = line.match(/^([A-Z0-9_]+)=(.*)$/i);
		if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
	});
}

(async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI);
		const email = 'admin@gmail.com';
		const password = 'Admin123';
		let admin = await User.findOne({ 'personalInfo.email': email });
		if (!admin) {
			const passwordHash = await bcrypt.hash(password, 10);
			admin = await User.create({
				role: 'admin',
				personalInfo: { firstName: 'Platform', lastName: 'Admin', email },
				credentials: { passwordHash, isActive: true },
			});
			console.log('Admin user created:', email);
		} else {
			console.log('Admin user already exists');
		}
	} catch (e) {
		console.error(e);
	} finally {
		await mongoose.disconnect();
		process.exit(0);
	}
})();


