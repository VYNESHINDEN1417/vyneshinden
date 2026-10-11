# Vyneshinden

Build me a portfolio app. Use the gif image attach as hero image with a title: VYNESHINDEN on top of it, use the "title.png" i attached for the title.



The hero image and the title is at the top.



The hero image shoyld have an overlay of fading black to transition to the rest of the screen.



Add 3 screen wide button literally below them.







1. About me



2. My works



3. Social







Button source code:







HTML



<button class="btn-174">



    <span>Button 174</span>



</button>







CSS



.btn-174 {



    position: relative;



    margin: 0 auto;



    border-radius: 10px;



    box-shadow: 0px 3px rgba(128, 128, 128, 1),



        0px 4px rgba(118, 118, 118, 1),



        0px 5px rgba(108, 108, 108, 1),



        0px 6px rgba(98, 98, 98, 1),



        0px 7px rgba(88, 88, 88, 1),



        0px 8px rgba(78, 78, 78, 1),



        0px 14px 6px -1px #000000;



    transition: box-shadow .1s ease-in-out;



    font-family: Arial, Helvetica, sans-serif;



    cursor: pointer;



    text-decoration: none;











    user-select: none;



    display: inline-flex;



    justify-content: center;



    align-items: center;



    border: none;



    padding: 0;



    background: none;



    /*** full width block ***/



    /* width: 100%; */



}







.btn-174 span {



    width: 100%;



    height: 100%;



    background-color: #E8E8E8;



    box-shadow: 0px -1px #fff,



        0px 1px 1px #FFFFFF;



    border-radius: 10px;



    transition: transform .1s ease-in-out;



    display: inline-block;



    padding: 12px 20px;



    color: #3A474D;



    text-transform: uppercase;



    font-size: 18px;



}







.btn-174:hover span {



    color: #353535;



    text-shadow: 0px -1px #cfcfcf;



}







.btn-174:active {



    box-shadow: 0px 10px 0px -2px #aaa9a9;



}







.btn-174:active span {



    transform: translate(0, 5px);



}







/*** disabled style ***/



.btn-174:disabled {



    pointer-events: none;



    opacity: .65;



    color: #7e7e7e;



    background: #dcdcdc;



    box-shadow: none;



    text-shadow: none;



}







/*** dark mode ***/



html.dark-mode .btn-174 {



    box-shadow: 0px 3px rgba(128, 128, 128, 1),



        0px 4px rgba(118, 118, 118, 1),



        0px 5px rgba(108, 108, 108, 1),



        0px 6px rgba(98, 98, 98, 1),



        0px 7px rgba(88, 88, 88, 1),



        0px 8px rgba(78, 78, 78, 1),



        0px 14px 6px -1px #000000;



}







After clicking any buttons, it should open into a new screen instead of scrolling downward. Each of the 3 buttons should have place holder image, place holder tittle and place holder description. 







Add loading screen







Use the attach image named "Tile.jpg" and use it multiple times as a tile to cover the entire screen, add a 60 percent dark overlay.



In the center add a progress bar with green color representing the progress.



The whole progress should always take 1.5 seconds.



Above the progress bar, there should be a text.



1. Loading level



2. Building terrain



The two text should be stack one on top of each other.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vyneshinden.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1c36a630-d911-42e9-b8d0-fe483b941f45).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
