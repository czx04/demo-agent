import { extractIntentAndData } from "./deepseek";
(async () => {
  const result = await extractIntentAndData("register");
  console.log(result);
})();
