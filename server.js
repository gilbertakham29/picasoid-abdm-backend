const express = require("express");
const pkg = require("mssql");
require("dotenv").config();
const cors = require("cors");
const { ConnectionPool } = pkg;

const app = express();
const port = process.env.port || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Create a connection pool
const config = {
  user: process.env.USER_NAME,
  password: process.env.PASSWORD,
  server: process.env.SERVER_NAME, // MSSQL server address
  database: process.env.DATABASE_NAME,
  options: {
    encrypt: true, // To set true for production
  },
};
const pool = new ConnectionPool(config);

// Connect to the database
pool
  .connect()
  .then(() => console.log("Connected to database"))
  .catch((err) => console.error("Database connection failed:", err));

app.post("/api/patientdetails", async (req, res) => {
  const {
    AbhaID,
    AbhaAddress,
    Title,
    UHID,
    PatientName,
    Pin,
    DOB,
    Age,
    PermanentAddress,
    Gender,
    ContactNo,
    State,
    IsABHACreated,
    IsActive,
  } = req.body;
  const request = pool.request();
  try {
    const query = await pool.query(`
    DECLARE @AbhaID VARCHAR(200),
    @AbhaAddress VARCHAR(300),
    @UHID VARCHAR(100),
    @PicasoNo VARCHAR(100),
    @Title VARCHAR(30),
    @PatientName VARCHAR(200),
    @Pin INT,
    @DOB DATETIME,
    @Age INT,
    @PermanentAddress VARCHAR(200),
    @Gender VARCHAR(50),
    @ContactNo VARCHAR(50),
    @State VARCHAR(200),
    @IsABHACreated BIT,
    @IsActive BIT

SET @AbhaID = '${AbhaID}';
SET @AbhaAddress = '${AbhaAddress}';
SET @UHID = '${UHID}';
SET @PicasoNo='UHID'+convert(varchar,RIGHT(YEAR(GETDATE()),2)) +convert(varchar,(isnull((select COUNT(*) from ABHA_PatientDetails),0)+1))
SET @Title = '${Title}';
SET @PatientName = '${PatientName}';
SET @Pin = ${Pin};
SET @DOB = '${new Date(DOB).toISOString()}';
SET @Age = ${Age};
SET @PermanentAddress = '${PermanentAddress}';
SET @Gender = '${Gender}';
SET @ContactNo = '${ContactNo}';
SET @State = '${State}';
SET @IsABHACreated = '${IsABHACreated}';
SET @IsActive = '${IsActive}'

INSERT INTO [dbo].[ABHA_PatientDetails] (
[AbhaID], [AbhaAddress],[UHID], [Title], [PatientName], [Pin], [DOB],
[Age], [PermanentAddress], [Gender], [ContactNo], [State] , [IsABHACreated], [IsActive]
) VALUES (
@AbhaID, @AbhaAddress,@PicasoNo, @Title, @PatientName, @Pin, @DOB,
@Age, @PermanentAddress, @Gender, @ContactNo, @State, @IsABHACreated, @IsActive
);`);

    // Execute query
    const result = await request.query(query);
    console.log("Inserted successfully:", result);

    res.json({ data: result.recordset, message: "Data inserted successfuly." });
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/api/patientlist", async (req, res) => {
  const { UHID, Name, DateFrom, Gender, Status } = req.body;
  const request = pool.request();
  try {
    const query = `
    SELECT TOP 1000 [PatientID],[AbhaID], [AbhaAddress],[UHID], [Title], [PatientName], [Pin], [DOB],
    [Age], [PermanentAddress], [Gender], [ContactNo], [State],[IsABHACreated],[AddedDate],[IsActive]
    FROM [dbo].[ABHA_PatientDetails]
    WHERE 
      ([UHID] = @UHID OR @UHID IS NULL) AND
      ([PatientName] = @Name OR @Name IS NULL) AND
      ([AddedDate] >= @DateFrom OR @DateFrom IS NULL) AND
      
      ([Gender] = @Gender OR @Gender IS NULL) AND
      ([IsActive] = @Status OR @Status IS NULL)
    `;
    request.input("UHID", UHID);
    request.input("Name", Name);
    request.input("DateFrom", DateFrom);

    request.input("Gender", Gender);
    request.input("Status", Status);

    const result = await request.query(query);

    console.log("Data fetched successfully:", result);

    res.json({ data: result.recordset, message: "Data inserted successfuly." });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
