export const STATE_CREATED = 0;
export const STATE_EXECUTED = 1;
export const STATE_SOLD = 2;

export const validTransitions = {
    [STATE_CREATED] : [STATE_EXECUTED],
    [STATE_EXECUTED] : [STATE_SOLD]
}