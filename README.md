# Requirements
- Docker
- Node
- Yarn

# Run it
- Clone the repository 
- Setup a Postrgres database in docker if you dont have one `yarn docker:postgres`
- Clone env file with `cp .env.example .env`
- Install dep: `yarn install``
- Setup database schema and client `yarn migrate`
- Seed database with testdata `yarn seed`
- Run server `yarn dev`

# Services

- Email delivery - https://account.postmarkapp.com/

# Auth
Auth is handled by [next-auth](https://next-auth.js.org/)

In production use email provider as sign in method. It will create or connect your account seamlessly. 

When not in production, you can use Credentials to sign in. Here you type the email of the account you want to sign inn as and a session will be created for you. Its acutally JWT behind the scenes.

![Login]("./../apps/core/public/login.png)