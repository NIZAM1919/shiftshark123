import { wait } from "./commonUtils.js";

export default function retryGenerator(
  mainFun: () => any,
  errorConditionFun: (_) => boolean,
  waitPeriod: number,
  retryCount: number,
  factor: number
) {
  let currentTry = 0;
  let currentWaitPeriod = waitPeriod;
  return async function retry() {
    const res = await mainFun();

    if (errorConditionFun(res)) {
      console.error("error", res);
      if (currentTry <= retryCount) {
        console.log(
          "retrying... currentTry->",
          currentTry,
          "with wait period of->",
          currentWaitPeriod
        );
        currentTry++;
        await wait(currentWaitPeriod);
        currentWaitPeriod = currentWaitPeriod * factor;
        await retry();
      } else {
        console.log("retrycount exhausted. currentTry->", currentTry);
        return res;
      }
    }
    return res;
  };
}

/** Eg
 * 
 function foo(m){
    const num = Math.floor((Math.random(10)*m))
    return num
}

const retryableFunction = retryGenerator(()=>foo(1000),(res)=>res%2,10,5)

 * 
 * 
*/
