import {
  createMenuButton,
  isProduction,
  buildPhotoOptions,
  isStaging,
} from '../../utils';
import path from 'path';
import * as fs from 'fs';
import { PhotoPage } from './page';
import { PhotoResponse } from '../../types';
export class LoginPage implements PhotoPage {
  constructor() {}
  build(data?: { accessToken: string }): PhotoResponse {
    let photo;
    try {
      // In production, image should be at ./images/banner.png (relative to working directory)
      // In development, it's at src/images/banner.png
      const imagePath =
        isProduction() || isStaging()
          ? path.resolve(process.cwd(), 'images/banner.png')
          : path.resolve(process.cwd(), 'src/images/banner.png');

      console.log(`🔍 Attempting to load image from: ${imagePath}`);
      photo = fs.readFileSync(imagePath);
      console.log(`✅ Image loaded successfully`);
    } catch (error) {
      console.error(`🔴 Failed to load image: ${error.message}`);
      // Use fallback - empty buffer
      photo = Buffer.from('');
    }

    const { accessToken } = data;

    const app_url =
      process.env.APP_ENV == 'production'
        ? 'https://t.me/AIIA_official_bot/trader_adventures'
        : 'https://t.me/AIIA_official_bot/trader_adventures';
    const url = `${app_url}?token=${accessToken}`;

    const text = `
🏁 Welcome to the Trader Adventures!
Rev your engines and predict token prices in real-time!

🔮 Guess: <i style="color:blue">PUMP</i> or <i style="color:blue">DUMP</i> in the next 5 seconds?

🏆 Earn Points: Correct guesses earn points and surprises!

👥 Invite Friends: Boost your score by inviting friends!

Do you have what it takes to be at the top?
`;

    const menu = buildPhotoOptions(
      [
        [
          createMenuButton('Play Now! 🎮', undefined, url),
          createMenuButton(
            'Join Channel 📢',
            undefined,
            'https://t.me/aiiafinance',
          ),
        ],
      ],
      text,
    );
    return { menu, photo };
  }
}
