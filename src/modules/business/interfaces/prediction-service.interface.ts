export interface ILoginResponse {
  access_token: string;
  user: {
    address: string;
    telegram_id: string;
    telegram_username: string;
    telegram_avatar_url: string;
    user_point?: string;
  };
}
