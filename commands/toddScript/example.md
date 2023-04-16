toddMake VARA;
toddNum 1 >add< 2;
toddTalk .VARA; -> 3

toddMake VARB 5;
toddNum .VARB >minus< 5;
toddTalk .VARB; -> 0

toddMake VARC [5, 3, 1];
toddMake VARD;
toddArr VARC <length>;

"VARA": {
  "type": "num",
  "value": 0,
  "locked": false,
}