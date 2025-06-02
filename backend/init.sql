
-- Tạo cơ sở dữ liệu
-- CREATE DATABASE IF NOT EXISTS TourManagement;
-- USE TourManagement;
USE railway;

-- Bảng user
CREATE TABLE IF NOT EXISTS user (
    userid INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(255) NOT NULL,           
    email VARCHAR(100),
    phonenumber VARCHAR(50),
    password VARCHAR(255),
    avatarurl TEXT,
    isdeleted BOOLEAN DEFAULT FALSE
);

-- Bảng role
CREATE TABLE IF NOT EXISTS role (
    roleid INT PRIMARY KEY AUTO_INCREMENT,
    rolename ENUM('admin', 'manager') NOT NULL DEFAULT 'admin',
    UNIQUE (rolename)
);

-- Bảng user_role
CREATE TABLE IF NOT EXISTS user_role (
    roleid INT,
    userid INT,
    PRIMARY KEY (roleid, userid),
    FOREIGN KEY (userid) REFERENCES user(userid) ON DELETE CASCADE,
    FOREIGN KEY (roleid) REFERENCES role(roleid) ON DELETE CASCADE
);

-- Bảng tour
CREATE TABLE IF NOT EXISTS tour (
    tourid INT PRIMARY KEY AUTO_INCREMENT,
    tourname VARCHAR(255),
    duration INT,
    description TEXT,
    price DECIMAL(10, 2),
    img_tour TEXT,
    isdeleted BOOLEAN DEFAULT FALSE
);

-- Bảng schedule
CREATE TABLE IF NOT EXISTS schedule (
    scheduleid INT PRIMARY KEY AUTO_INCREMENT,
    tourid INT,
    startdate DATETIME,
    capacity INT,
    availablespots INT NOT NULL,
    isdeleted BOOLEAN DEFAULT FALSE,
    status ENUM('available', 'full') DEFAULT 'available',
    FOREIGN KEY (tourid) REFERENCES tour(tourid) ON DELETE CASCADE
);

-- Bảng booking
CREATE TABLE IF NOT EXISTS booking (
    bookingid INT PRIMARY KEY AUTO_INCREMENT,
    userid INT,
    scheduleid INT,
    bookingdate DATETIME DEFAULT CURRENT_TIMESTAMP,
    numberofguests INT,
    totalamount DECIMAL(10, 2),
    status ENUM('booked', 'paid', 'cancelled', 'pending') DEFAULT 'pending',
    isdeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (userid) REFERENCES user(userid),
    FOREIGN KEY (scheduleid) REFERENCES schedule(scheduleid)
);

-- Bảng service
CREATE TABLE IF NOT EXISTS service (
    serviceid INT PRIMARY KEY AUTO_INCREMENT,
    servicename VARCHAR(255),
    description TEXT,
    price DECIMAL(10, 2),
    isdeleted BOOLEAN DEFAULT FALSE
);

-- Bảng booking_service
CREATE TABLE IF NOT EXISTS booking_service (
    bookingid INT,
    serviceid INT,
    quantity INT,
    PRIMARY KEY (bookingid, serviceid),
    FOREIGN KEY (bookingid) REFERENCES booking(bookingid),
    FOREIGN KEY (serviceid) REFERENCES service(serviceid)
);

-- Bảng tour_service
CREATE TABLE IF NOT EXISTS tour_service (
    tourid INT,
    serviceid INT,
    status ENUM('available', 'optional') DEFAULT 'available',
    isdeleted BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (tourid, serviceid),
    FOREIGN KEY (tourid) REFERENCES tour(tourid) ON DELETE CASCADE,
    FOREIGN KEY (serviceid) REFERENCES service(serviceid)
);

-- Bảng schedule_ts
CREATE TABLE IF NOT EXISTS schedule_ts (
    tourid INT,
    serviceid INT,
    scheduleid INT,
    availablespots INT,
    capacity INT,
    PRIMARY KEY (tourid, serviceid, scheduleid),
    FOREIGN KEY (scheduleid) REFERENCES schedule(scheduleid) ON DELETE CASCADE,
    FOREIGN KEY (tourid) REFERENCES tour(tourid) ON DELETE CASCADE,
    FOREIGN KEY (serviceid) REFERENCES service(serviceid) ON DELETE CASCADE
);

-- Bảng feedback
CREATE TABLE IF NOT EXISTS feedback (
    feedbackid INT PRIMARY KEY AUTO_INCREMENT,
    userid INT,
    tourid INT,
    rating INT,
    content TEXT,
    feedbackdate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userid) REFERENCES user(userid),
    FOREIGN KEY (tourid) REFERENCES tour(tourid)
);

-- Bảng participant
CREATE TABLE IF NOT EXISTS participant (
    participantid INT PRIMARY KEY AUTO_INCREMENT, 
    bookingid INT NOT NULL,                      
    fullname VARCHAR(255) NOT NULL,           
    email VARCHAR(255),         
    phonenumber VARCHAR(50),                
    fullnameonpassport VARCHAR(255) NOT NULL,  
    passportnumber VARCHAR(100) NOT NULL,        
    dateofbirth DATE NOT NULL,                 
    nationality VARCHAR(255),       
    gender ENUM('male', 'female'),
    FOREIGN KEY (bookingid) REFERENCES booking(bookingid)
); 

-- Bảng itinerary
CREATE TABLE IF NOT EXISTS itinerary (
    itineraryid INT PRIMARY KEY AUTO_INCREMENT,
    tourid INT NOT NULL,
    daynumber INT NOT NULL,
    location VARCHAR(255),
    activities TEXT,
    mealsincluded VARCHAR(255),
    imageurl TEXT,
    isdeleted BOOLEAN DEFAULT FALSE,
    description TEXT,
    FOREIGN KEY (tourid) REFERENCES tour(tourid) ON DELETE CASCADE
);

-- Bảng categories
CREATE TABLE IF NOT EXISTS categories (
    categoryid INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Bảng posts
CREATE TABLE IF NOT EXISTS posts (
    postid INT AUTO_INCREMENT PRIMARY KEY,
    authorid INT NOT NULL,
    categoryid INT NOT NULL,
    views INT DEFAULT 0,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (authorid) REFERENCES user(userid) ON DELETE CASCADE,
    FOREIGN KEY (categoryid) REFERENCES categories(categoryid) ON DELETE CASCADE
);

-- Bảng postcontent
CREATE TABLE IF NOT EXISTS postcontent (
    contentid INT AUTO_INCREMENT PRIMARY KEY,
    postid INT NOT NULL,
    imageurl TEXT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255) DEFAULT NULL,
    contentintro TEXT DEFAULT NULL,
    quote TEXT DEFAULT NULL,
    contentbody TEXT NOT NULL,
    link VARCHAR(2055) DEFAULT NULL,
    FOREIGN KEY (postid) REFERENCES posts(postid) ON DELETE CASCADE
);

-- Bảng comments
CREATE TABLE IF NOT EXISTS comments (
    commentid INT AUTO_INCREMENT PRIMARY KEY,
    postid INT NOT NULL,
    authorid INT NOT NULL,
    content TEXT NOT NULL,
    createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (postid) REFERENCES posts(postid) ON DELETE CASCADE,
    FOREIGN KEY (authorid) REFERENCES user(userid) ON DELETE CASCADE
);

-- Bảng userlikes
CREATE TABLE IF NOT EXISTS userlikes (
    likeid INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    postid INT NOT NULL,
    UNIQUE(userid, postid),
    FOREIGN KEY (userid) REFERENCES user(userid) ON DELETE CASCADE,
    FOREIGN KEY (postid) REFERENCES posts(postid) ON DELETE CASCADE
);


-- Dành cho PostgreSQL
-- INSERT INTO categories (name)
-- VALUES ('blog'), ('reportage')
-- ON CONFLICT DO NOTHING;

-- INSERT INTO role (RoleName)
-- VALUES ('Admin'), ('Manager')
-- ON CONFLICT DO NOTHING;



