const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const xlsx = require("xlsx");
const nodemailer = require("nodemailer");
// const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs");
const { createCanvas, loadImage, registerFont } = require("canvas");

const app = express();
const PORT = 5555;

// Connect to MongoDB using Mongoose
mongoDBURL =
  "mongodb+srv://root:root@certificate-generator.tnda1bz.mongodb.net/certificate-generator?retryWrites=true&w=majority";

// Create a Mongoose model for your data
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    mobile: {
      type: Number,
      required: true,
      unique: true,
      // validate: {
      //   validator: function (v) {
      //     // Validate that mobile is exactly 10 digits long
      //     return /^\d{10}$/.test(v);
      //   },
      //   message: (props) =>
      //     `${props.value} is not a valid 10-digit mobile number!`,
      // },
    },
    amount: {
      type: Number,
      // required: true,
    },
    trees: {
      type: Number,
      // required: true,
    },
  },
  { timestamps: true }
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "certificatesender17@gmail.com",
    pass: "tvmg xdwz uowc tzct",
  },
});

const User = mongoose.model("User", userSchema);

// Set up Multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/read", upload.single("file"), async (req, res) => {
  try {
    // Handle the uploaded Excel file

    await User.deleteMany({});

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

    // Convert Excel data to JSON
    const jsonData = xlsx.utils.sheet_to_json(
      workbook.Sheets[workbook.SheetNames[0]]
    );

    // Store JSON data in MongoDB using Mongoose model

    for (let i = 0; i < jsonData.length; i++) {
      const newUser = {
        name: jsonData[i].Name,
        email: jsonData[i].Email,
        mobile: jsonData[i].Mobile,
        amount: jsonData[i].Amount,
        trees: jsonData[i].Trees,
      };

      const user = await User.create(newUser);

      const backgroundImage = await loadImage(
        "/certificateGenerator/backend/cover.png"
      );

      const imageCanvas = createCanvas(
        backgroundImage.width,
        backgroundImage.height,
        "pdf"
      );

      const context = imageCanvas.getContext("2d");

      context.drawImage(
        backgroundImage,
        0,
        0,
        backgroundImage.width,
        backgroundImage.height
      );

      context.font = "69px Luciole";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(user.name, 500, 105);
      context.textAlign = "center";
      context.fillStyle = "brown";
      context.fillText(user.trees, 1000, 795);

      fs.writeFileSync(
        `certificate_${user._id}.pdf`,
        imageCanvas.toBuffer("file/pdf")
      );
      // return imgName;

      // console.log(backgroundImage);

      // const certificateTemplateBuffer = fs.readFileSync(
      //   "/certificateGenerator/backend/certificate_demo.pdf"
      // );
      // const pdfDoc = await PDFDocument.load(certificateTemplateBuffer);
      // const page = pdfDoc.getPages()[0];

      // Calculate center coordinates

      // const centerX = page.getWidth() / 2;
      // const centerY = page.getHeight() / 2;

      // console.log(page.getWidth(), page.getHeight());

      // Define text styles
      // const fontSizeTitle = 14;
      // const fontSizeDetails = 12;
      // const fontSize = 72;

      // Draw text at the center and adjust for positioning
      // page.drawText(`${user.email}`, {
      //   x: 1220,
      //   y: 900,
      //   color: rgb(0.878, 1.0, 0.875),
      //   fontSize: 32,

      //   // textAlign: "center",
      // });

      // page.drawText(`${user.name}`, {
      //   x: centerX - 200,
      //   y: 700,
      //   color: rgb(103 / 255, 154 / 255, 102 / 255),
      //   size: fontSize,
      // });

      // page.drawText(`Mobile: ${user.mobile}`, {
      //   x: centerX,
      //   y: centerY - 30, // Adjust vertically as needed
      //   fontColor: rgb(0, 0, 0),
      //   fontSize: fontSizeDetails,
      //   textAlign: "center",
      // });

      // page.drawText(`Amount: ${user.amount}`, {
      //   x: centerX,
      //   y: centerY - 50, // Adjust vertically as needed
      //   fontColor: rgb(0, 0, 0),
      //   fontSize: fontSizeDetails,
      //   textAlign: "center",
      // });

      // page.drawText(`Trees: ${user.trees}`, {
      //   x: centerX,
      //   y: centerY - 70, // Adjust vertically as needed
      //   fontColor: rgb(0, 0, 0),
      //   fontSize: fontSizeDetails,
      //   textAlign: "center",
      // });

      // // Save the edited PDF
      // const modifiedPdfBytes = await pdfDoc.save();
      // fs.writeFileSync(`certificate_${user._id}.pdf`, modifiedPdfBytes);

      const mailOptions = {
        from: {
          name: "Hashir Yameen",
          address: "certificatesender17@gmail.com",
        },
        to: user.email,
        subject:
          "Certificate for your humanitarian work of donating money for trees 🌳🌳",
        text: `Your info -> ${user.name} ${user.amount} ${user.trees}`,
        attachments: [
          {
            filename: `certificate_${user._id}.pdf`,
            path: `certificate_${user._id}.pdf`,
            encoding: "base64",
          },
        ],
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error(error);
        } else {
          console.log("Email sent: " + info.response);
        }
      });
    }

    res.json(jsonData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

mongoose
  .connect(mongoDBURL)
  .then(() => {
    console.log("App connected to database");
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
