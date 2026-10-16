/**
 * The bank account for a normal transfer (SEPA). The window for parents shows it as soon as the IBAN AND the holder are filled in;
 * without one of them nothing is shown. (On iOS no gifts outside the app are offered, as with PayPal and Ko-fi.)
 */
export const bank = {
  /** The holder of the account, as it must be written in the transfer. */
  holder: '',
  iban: 'DE26 1001 0123 4890 0685 45',
  bic: '',
  bankName: '',
  /** What the sender writes as the purpose. */
  purpose: 'Spende LambKing'
}
