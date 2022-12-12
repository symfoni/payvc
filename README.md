PayVC is a platform for putting up a paywall for VCs, which is an essential component for businesses to monetize their data in the world of Self-Sovereign Identity (SSI). This is a much-needed component for SSI to get to market.

In the SSI model, the request comes from the user. However, with PayVC, the system transparently allows the Verifier (the party requesting the data) to pay the Issuer directly, while keeping the SSI issuer-holder-verifier chain intact. This solves the issue of ensuring that each party gets paid in complex VC dependency chains, such as when a VC is needed by an Issuer as underlying proof for the VC they are issuing, all without bothering the user.

This project includes a server with dashboards and API. 

* Server med API som gir dashboard til alle
  * Mangage credential offers and requsitions
  * Manage payment
  * statistikk
* It also includes a Foundry (mock verifier-service) and BR og Symfoni (2x mock issuer-service).
* For the app used in the demo, got to [payvc-demo-wallet](https://github.com/symfoni/payvc-demo-wallet/tree/demo) 

![Imgur](https://i.imgur.com/m6wlxun.png)



## TOC

- [Run it](#run-it)
  - [Requirements](#requirements)
  - [How to set up server and db](#how-to-set-up-server-and-db)
  - [Development](#development)
  - [Services](#services)
  - [Auth](#auth)


# Run it

The steps outline the necessary requirements, provide commands for setting up a PostgreSQL database in Docker, and include information on how to run the server, seed the database with test data, and use test users for development. 

## Requirements

- Docker
- Node
- Yarn

## How to set up server and db

- Clone the repository 
- Setup a Postrgres database in docker if you dont have one `yarn docker:postgres`
  - Persist data about accounts, credentials types, issuers, verifiers etc. It does not persist anything about credentials, just references to identifiers for issuers and verifiers.
- Clone env file with `cp .env.example .env`
- Install dep: `yarn install`
- Setup database schema and client `yarn migrate`
- Seed database with testdata `yarn seed`
- Run server `yarn dev`

## Development
You can find test users to use in src/db/seed.ts.

## Services

- Email delivery - https://account.postmarkapp.com/

## Auth
Auth is handled by [next-auth](https://next-auth.js.org/)

In production use email provider as sign in method. It will create or connect your account seamlessly. 

When not in production, you can use Credentials to sign in. Here you type the email of the account you want to sign inn as and a session will be created for you. Its acutally JWT behind the scenes.
