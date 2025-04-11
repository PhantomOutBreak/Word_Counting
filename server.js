const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

// กำหนดเส้นทางไปยัง clips.json ในโฟลเดอร์ controller
const clipsFilePath = path.join(__dirname, 'controller', 'clips.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ฟังก์ชันตรวจสอบและสร้างโฟลเดอร์ controller ถ้ายังไม่มี
async function ensureControllerFolder() {
  const controllerDir = path.join(__dirname, 'controller');
  try {
    await fs.access(controllerDir);
  } catch {
    console.log('Creating controller folder');
    await fs.mkdir(controllerDir);
  }
}

// ฟังก์ชันอ่านไฟล์ JSON
async function readClips() {
  try {
    await ensureControllerFolder();
    const data = await fs.readFile(clipsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.log('No clips.json found, creating new one');
    return { clips: [] };
  }
}

// ฟังก์ชันเขียนไฟล์ JSON
async function writeClips(data) {
  try {
    await ensureControllerFolder();
    await fs.writeFile(clipsFilePath, JSON.stringify(data, null, 2));
    console.log('Data written to clips.json');
  } catch (err) {
    console.error('Error writing to clips.json:', err);
    throw err;
  }
}

// ฟังก์ชันถอดรหัส Base64
function decodeBase64(encoded) {
  try {
    return Buffer.from(encoded, 'base64').toString('utf8');
  } catch (err) {
    console.error('Error decoding:', err);
    throw new Error('Invalid Base64 format');
  }
}

// API: บันทึกข้อความใหม่
app.post('/save', async (req, res) => {
  const { id, clip } = req.body;
  if (!id || !clip) {
    return res.status(400).json({ error: 'ต้องระบุ ID และข้อความ' });
  }
  try {
    const decodedId = decodeBase64(id);
    const decodedClip = decodeBase64(clip); // ถอดรหัส clip ด้วย
    const data = await readClips();
    data.clips.push({ id: decodedId, clip: decodedClip });
    await writeClips(data);
    res.json({ message: 'บันทึกข้อความเรียบร้อย' });
  } catch (err) {
    console.error('Error in /save:', err);
    res.status(500).json({ error: err.message || 'เกิดข้อผิดพลาดในการบันทึก' });
  }
});

// API: ดึงข้อความทั้งหมดหรือเฉพาะ ID
app.get('/clips', async (req, res) => {
  const { id } = req.query;
  try {
    const data = await readClips();
    if (id) {
      const decodedId = decodeBase64(id);
      const userClips = data.clips.filter(clip => clip.id === decodedId);
      // ส่ง clip โดยไม่ encode กลับ เพราะไคลเอนต์จะจัดการแสดงผล
      res.json(userClips);
    } else {
      res.json(data.clips);
    }
  } catch (err) {
    console.error('Error in /clips:', err);
    res.status(500).json({ error: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// เริ่มเซิร์ฟเวอร์
const server = app.listen(port, () => {
  console.log(`เซิร์ฟเวอร์ทำงานที่ http://localhost:${port}`);
});

// จัดการการปิดเซิร์ฟเวอร์อย่างถูกต้อง
process.on('SIGINT', () => {
  console.log('ได้รับ SIGINT กำลังปิดเซิร์ฟเวอร์...');
  server.close(() => {
    console.log('เซิร์ฟเวอร์ปิดเรียบร้อย');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('ได้รับ SIGTERM กำลังปิดเซิร์ฟเวอร์...');
  server.close(() => {
    console.log('เซิร์ฟเวอร์ปิดเรียบร้อย');
    process.exit(0);
  });
});