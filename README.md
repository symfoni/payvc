# Requirements
- Docker
- Node
- Yarn

# Run it
Clone the repository 
```bash
cp .env.example .env
```



# Development

# Services

- Email delivery - https://account.postmarkapp.com/

# Auth
Auth is handled by [next-auth](https://next-auth.js.org/)

In production use email provider as sign in method. It will create or connect your account seamlessly. 

When not in production, you can use Credentials to sign in. Here you type the email of the account you want to sign inn as and a session will be created for you. Its acutally JWT behind the scenes.

![Login]("./../apps/core/public/login.png)