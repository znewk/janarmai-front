import { checkGbdFl, checkBmg, sendSmsCode, verifySmsCode, checkBerkut, checkVehicleRegistry, checkGbdUl, checkAdminCredentials } from '../src/mocks/api';

async function run() {
  const started = Date.now();
  console.log('checkGbdFl success:', await checkGbdFl({ iin: '900101300123', fio: 'Тест' }));
  console.log('checkGbdFl error (9):', await checkGbdFl({ iin: '900101300129', fio: 'Тест' }));
  console.log('checkBmg error (7):', await checkBmg({ iin: '900101300127', phone: '+7' }));
  console.log('sendSmsCode:', await sendSmsCode('+77011112233'));
  console.log('verifySmsCode wrong:', await verifySmsCode('9999'));
  console.log('verifySmsCode correct:', await verifySmsCode('1234'));
  console.log('checkBerkut duplicate:', await checkBerkut({ passportNumber: 'DUP12345' }));
  console.log('checkVehicleRegistry error:', await checkVehicleRegistry('ERR001'));
  console.log('checkGbdUl success:', await checkGbdUl('123456789012'));
  console.log('checkAdminCredentials success:', await checkAdminCredentials('kmg.analyst', 'demo1234'));
  console.log('checkAdminCredentials error:', await checkAdminCredentials('kmg.analyst', 'wrong'));
  console.log(`\nTotal elapsed ${Date.now() - started}ms for 11 sequential calls (искусственная задержка 300-1500мс каждая)`);
}

run();
