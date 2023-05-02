import fs, { readFileSync } from 'fs';
import path from 'path';
import zlib from 'zlib';
import { Transform, pipeline } from 'stream';
import os from 'os';
import readline from 'readline';
import { createHash } from 'crypto';

// Info to console the table
const data = [
  { id: 1, Command: 'ls', Description: 'To see the current directory files' },
  { id: 2, Command: 'cd', Description: 'Enter the folders' },
  { id: 3, Command: 'cat', Description: 'For reading the files' },
  { id: 4, Command: 'add', Description: 'For creating files' },
  { id: 5, Command: 'rm', Description: 'For deleting files' },
  { id: 6, Command: 'rn', Description: 'For renaming the files' },
  { id: 7, Command: 'cp', Description: 'For copying the files' },
  { id: 8, Command: 'mv', Description: 'For movinging the files' },
  { id: 9, Command: 'hash', Description: 'For hashing the files' },
  { id: 10, Command: 'compress', Description: 'compress the file' },
  { id: 11, Command: 'decompress', Description: 'decompress the file' },
  { id: 12, Command: '.exit', Description: 'exit the program' },
  { id: 13, Command: 'os', Description: 'Operating system info' },
];

// Welcome message //
const username = process.argv[2].split("=")[1];
console.log(`As-salaam 'alykum, ${username}! Welcome to the File Manager`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '> ',
});

let currentDirCd = os.homedir();

//Commands
rl.on("line", (input) => {
  const [command, ...args] = input.trim().split(" ");
  switch (command) {
    case "ls":
      try {
        const currentDir = process.cwd();
        fs.readdir(currentDir, { withFileTypes: true }, (err, files) => {
          if (err) {
            console.error('Unable to read directory:', err);
            return;
          }

          const directories = files.filter(file => file.isDirectory());
          const filesOnly = files.filter(file => file.isFile());
          directories.sort((a, b) => a.name.localeCompare(b.name));
          filesOnly.sort((a, b) => a.name.localeCompare(b.name));

          const data = [
            ...directories.map(directory => ({ Type: 'DIR', Name: directory.name })),
            ...filesOnly.map(file => ({ Type: 'FILE', Name: file.name }))
          ];
          console.table(data);
        });
      } catch (error) {
        console.error('Smth went wrong, please check and try again')
      }
      return;
    case "cd":
      try {
        const changeDirectory = (directory) => {
          const targetDir = path.resolve(directory);
          process.chdir(targetDir);
          currentDirCd = targetDir;
        };

        if (args[0]) {
          changeDirectory(args[0]);
        } else {
          console.log('Invalid input: missing directory argument');
        }
      } catch (error) {
        console.error(`Operation failed ${error.message}`)
      }
      break;
    case "cat":
      const filePath = path.resolve(process.cwd(), args[0]);
      console.log(filePath);
      try {
        if (!filePath) {
          throw new Error('FS operation failed')
        } else {
          const contents = readFileSync(filePath, { encoding: 'utf8' });
          console.log(contents);
        }
      } catch (error) {
        console.error(`FS operation failed: ${error.message}`)
      }
      return;
    case "add":
      const filePathAdd = path.join(process.cwd(), args[0]);
      try {
        fs.accessSync(filePathAdd);
        throw new Error('FS operation failed');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(error);;
        }
        fs.writeFileSync(filePathAdd, '');
        console.log('File created!');
      }
      return;
    case "rm":
      const pathFile = path.join(process.cwd(), args[0])
      try {
        if (!pathFile) {
          console.error('File not exist')
        } else {
          fs.unlinkSync(pathFile);
          console.log('File deleted successfully!');
        }
      } catch (error) {
        console.error('Smth went wrong, pls check and try again.')
      }
      return;
    case "rn":
      const oldFilePath = path.join(process.cwd(), args[0]);
      const newFilePath = path.join(process.cwd(), args[1]);

      try {
        const srcExists = fs.existsSync(oldFilePath);
        if (!srcExists) {
          throw new Error('File not exist!')
        }
        const dest = fs.existsSync(newFilePath);
        if (dest) {
          throw new Error('File already exist.')
        }

        fs.rename(oldFilePath, newFilePath, (err) => {
          if (err) throw err;
          console.log('File renamed!');
        })

      } catch (error) {
        console.error(error)
      }
      return;
    case "cp":
      const copyOldPath = path.join(process.cwd(), args[0]);
      const copyNewPath = path.join(process.cwd(), args[1]);

      if (copyOldPath) {
        try {
          fs.mkdirSync(copyNewPath);
          const files = fs.readdirSync(copyOldPath);

          for (const file of files) {
            const sourcePath = path.join(copyOldPath, file);
            const destPath = path.join(copyNewPath, file);
            fs.copyFileSync(sourcePath, destPath);
          }

          console.log('Files copied successfully!');
        } catch (error) {
          console.error(`FS operation failed ${error.message}`);
        }
      } else if (copyNewPath || !copyOldPath) {
        console.error(`FS operation failed ${error.message}`);
      }
      return;
    case "mv":
      const copyOldFile = path.join(process.cwd(), args[0]);
      const copyNewFile = path.join(process.cwd(), args[1]);

      try {
        const readableStream = fs.createReadStream(copyOldFile);
        const writableStream = fs.createWriteStream(copyNewFile);

        readableStream.on('end', () => {
          fs.unlinkSync(copyOldFile);
        });

        readableStream.pipe(writableStream);
        console.log('Done!');
      } catch (error) {
        console.error(`Operation failed ${error.message}`);
      }
      return;
    case 'hash':
      const pathForHash = path.join(process.cwd(), args[0])
      try {
        const buff = fs.readFileSync(pathForHash)
        const hash = createHash('sha256').update(buff).digest('hex')
        console.log(hash)
      } catch (error) {
        console.error('Smth went wrong pls check and try again.');
      }
      return;
    case "compress":
      const pathForCompressOld = path.join(process.cwd(), args[0]);
      const pathForCompressNew = path.join(process.cwd(), args[1]);

      try {
        const gzip = zlib.createGzip();
        const source = fs.createReadStream(pathForCompressOld)
        const destination = fs.createWriteStream(pathForCompressNew)

        pipeline(source, gzip, destination, (err) => {
          if (err) {
            console.error('An error occured:', err);
            process.exitCode = 1;
          }
        })
        console.log("File compressed successfully!");
      } catch (error) {
        console.error(error.message);
      }
      break;
    case "decompress":
      const pathForDecompressOld = path.join(process.cwd(), args[0]);
      const pathForDecompressNew = path.join(process.cwd(), args[1]);

      try {
        const unzip = zlib.createUnzip();
        const input = fs.createReadStream(pathForDecompressOld);
        const output = fs.createWriteStream(pathForDecompressNew);

        pipeline(input, unzip, output, (err) => {
          if (err) console.log(err);
        })
        console.log('File successfully decompressed!');
      } catch (error) {
        console.error('Smth went wrong', error.message);
      }
      break;
    case ".exit":
      rl.close();
      break;


      console.table(data, ['Command', 'Description']);
      return;
    case "os":
      if (args[0] === '--EOL') {
        console.log(`The default End-Of-Line for this system is: ${JSON.stringify(os.EOL)}`);
      } else if (args[0] === '--cpus') {
        const cpus = os.cpus();
        console.log(`This system has ${cpus.length} CPUs:`);
        cpus.forEach((cpu, index) => {
          console.log(`  CPU ${index + 1}:`);
          console.log(`    Model: ${cpu.model}`);
          console.log(`    Speed: ${cpu.speed / 1000} GHz`);
        });
      } else if (args[0] === '--homedir') {
        console.log(`The home directory for the current user is: ${os.homedir()}`);
      } else if (args[0] === '--username') {
        console.log(`The current system user name is: ${os.userInfo().username}`);
      } else if (args[0] === '--architecture') {
        console.log(`The Node.js binary for this system is compiled for ${os.arch()} architecture`);
      } else {
        console.log(`Invalid command: ${args[0]}. Available commands are "--EOL", "--cpus", "--homedir", "--username", and "--architecture".`);
      }
      return;
    default:
      console.log(`Command "${command}" not recognized. Please enter ".help" for more info.`);
      return;
  }
  console.log(`You are currently in ${process.cwd()}`);
});
// Exit the program
rl.on("close", () => {
  console.log(`Thank you for using File Manager, ${username}, goodbye!`);
  process.exit();
});


