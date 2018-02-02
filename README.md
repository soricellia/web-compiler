# Web Compiler
## Stack information

Currently, my stack is set up as follows:

* linux
* nodejs
* jquery/jquery packages (mostly for the text editor)
* possible postgress in the future if i get around to it... lets build a compiler first

## Getting Started

#### A quick note

NVM is a node version manager. if you have multiple students using nodejs, this is a really convient way to set up nodejs. If you dont want to install NVM, youll have to install the nodejs and npm versions manually.  

#### First, install nvm. 

`curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash`

you can check `nvm --version` to make sure everything installed ok

#### Install node js.

I am using node v9.4.0

`nvm install v9.4.0`

you should get a message at the end that looks like: `Now using node v9.4.0 (npm v5.6.0)`

##### If you dont get the message, youll have to install NPM manually. 

`apt-get install npm`

i'm using npm v5.6.0

#### Download the project
Clone my project, and nagivate to the project directory through a terminal: `cd web-compiler/`

#### Run the project

Now, from a terminal type: `npm start`

Access the application by going to your web browser and typing: `127.0.0.1:3000`