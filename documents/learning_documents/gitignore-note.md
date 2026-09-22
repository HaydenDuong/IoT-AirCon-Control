# GitIgnore Explanation

## Explanation

    - .env.*: this will catch environment-specific files such as .env.local, .env.development, .env.production - since we need a specific .env for each stage

    - !.env.example: since we included ".env.*", thus, we need to include an exemption for .env.example

    - *.key: these files usually contain private crytographic keys.

    - *.pem: these files are often certificates / private key.

    - *.p12, *.pfx: these are certificate bundles - can contain a private key & password-protected identity.

    - node_modules/: Installed npm dependency packages - these are large and can be recreated from "package.json" & "package-lock.json"

    - dist/: Compiled JS output - eventhough we are using TS for this project, the build can regenerate "dist"

    - coverage/: Test coverage reports - generated whenever tests run; the report should not be included to GitHub

    - *.tsbuildinfo: TS incremental-build cache - help compiler run faster locally - no need to include this to GitHub

    - *.db, *.sqlite, *.sqlite3: Local DB files - Local test / development data should not be committed to GitHub. Only DB schema & migrations

    -.DS_Store: macOS Finder metadata - OS-generated file which is not related to this project

    - Thumbs.ds: Windows thumbnail cache - Another OS-generated unrelated to the project.

## Questions

Why would adding ".env" to ".gitignore" not protect a credential that was already commited?

    - Adding ".env" to ".gitignore" does not erase a credential from earlier commits / from copies of the GitHub Repo.

        - Should immediately treat that credentials as exposed and revoke / rotate it.
    

    - .gitignore only prevents untracked files from being added accidentally.

        - If Git is already tracking .env, it can still be committed again. 
        
        - Solution: git rm --cached .env stops tracking it while keeping your local file, but it does not remove the secret from history.
        

    - So the order is: 

        1. Rotate the credential.

        2. Stop tracking the file.
        
        3. Then, consider whether the repository history also needs cleaning.
