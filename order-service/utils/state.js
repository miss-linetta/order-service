export const STATE_CREATED = 0
export const STATE_CONFIRMED = 1
export const STATE_EXECUTED = 2
export const STATE_SOLD = 3

export const validTransitions = {
  [STATE_CREATED]: [STATE_CONFIRMED], // Confirmation Service required
  [STATE_CONFIRMED]: [STATE_EXECUTED],
  [STATE_EXECUTED]: [STATE_SOLD],
}
