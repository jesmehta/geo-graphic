let  xOff, yOff, zOff, delta;
let step;

let slBands, slElev, slIsle, slRidge;  //sliders
let pBands, pElev, pIsle, pRidge;     //HTML <p>

let nMax;

function setup() {
  createCanvas(600,600);
  background(225);
  noStroke();

  //noise
  xOff = 0;
  yOff = 100;
  zOff = 200;
  delta = 0.05;
  nMax = 0;

  //scaling
  step = 3;

  //controls
  createP(""); //spacing

  pBands = createP("Bands");
  slBands = createSlider(0,20,0,1);

  pElev = createP("Elevation exponent");
  slElev = createSlider(0.1,5,0.7,0.1);

  pIsle = createP("Island factor");
  slIsle = createSlider(0,1.5,0,0.1);

  pRidge = createP("Ridge Threshold");
  slRidge = createSlider(0.1,1,0,0.1);

}

function draw() {

  let elev = slElev.value();
  let b = slBands.value();
  let ridge = slRidge.value();

  let d;
  let nMax2 = 0;

  for(let j = 0;j<height;j+=step)
  {
    for(let i = 0;i<width;i+=step)
    {
      //basic noise
      let n = noise(xOff, yOff,zOff);

      let exp = noise(xOff+100, yOff+200, zOff+300);
      // n = pow(n,exp);

      let invExp = 1/exp;
      n = pow(n,invExp);

      //elevation exponent
      n = pow(n,elev);

      //island enhancement
      let isleFac = slIsle.value();
      if(isleFac > 0)
      {
        let ds = dist(i,j,width/2,height/2);
        d = ds/(width*isleFac);      //island size as poroportion of full width
        n = (1+n-d)/2;               //island-ification
      }

      //contour banding
      if(b>2)                        //option for no banding if b = 0, 1
      {
        n = int(map(n, 0, 1, 0, b));  //banding
        n = n/b;                      //normalizing from 0-b to 0-1
      }

      //ridging
      if(n>ridge)
      {
        n = ridge - (n - ridge);

        if(n<0)
        {
          n = -n;
        }
      }

      //calc nMax to normalize in next loop
      if (n>nMax2)
      {
        nMax2 = n;
      }

      //remap to normalize
      if(nMax>0)
      {
        n = n/nMax;
      }

      fill(n*255);
      rect(i,j,step,step);
      xOff+=delta;
    }
    xOff = 0;
    yOff +=delta;
  }
  yOff = 100;
  // zOff +=delta;

  nMax = nMax2;         //swap nMax2 (current round) to use for remap in next round


  pBands.html("Bands : " + slBands.value());
  pElev.html("Elevation exponent : " + slElev.value());
  pIsle.html("Island factor : " + slIsle.value());
  pRidge.html("Ridge Threshold : " + slRidge.value());

}
