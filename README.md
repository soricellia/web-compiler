# Web Compiler
## A note to the Professor

There are 2 things I wanted to bring up before you grade my project, so things are less confusing

1) The console on my GUI is pretty small, and im working on making it expand to full-screen. However, when youre grading this, it might be annoying to look at a CST with the small console. I added a log to the terminal you can view on a successful parse, so you can view the CST a little easier for now. You can still see the output in my GUI, and this is temporary until I can expand my console toolbar. Youll see what I mean.    

2) This one is actually really annoying! Because of how im sending information to and from my backend, sometimes youll notice while compiling multiple programs that some of the programs are coming back to the front end in the WRONG ORDER. this means i lex fine, but youll notice some programs in the wrong order on parse. I have a fix in the works, but its commented out and its 4am and my eyes are bleeding. terribly sorry. I tried to make this easy. Enjoy!

Happy Snow Day

## Stack information

Currently, my stack is set up as follows:

Font End:
* HTML5, CSS
* jquery/javascript
* bootstrap 
* CodeMirror (jquery pluggin, used for text editor)

Back End:

* nodejs
* EJS templates

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