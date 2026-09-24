-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 21, 2026 at 04:32 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `codera_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `community_comments`
--

CREATE TABLE `community_comments` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `community_posts`
--

CREATE TABLE `community_posts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` text NOT NULL,
  `upvotes` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `community_posts`
--

INSERT INTO `community_posts` (`id`, `user_id`, `title`, `content`, `upvotes`, `created_at`) VALUES
(3, 1, 'Tips for learning Flexbox faster', 'I found that building small layout challenges every day helped me understand Flexbox much better than just reading docs. Try Flexbox Froggy!', 15, '2026-09-06 20:24:13'),
(4, 1, 'How do PHP sessions work?', 'Can someone explain the difference between session_start() and cookies? I keep getting confused when studying the PHP module.', 8, '2026-09-06 20:24:13');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `level` enum('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
  `duration` varchar(50) NOT NULL,
  `lesson_count` int(11) NOT NULL DEFAULT 0,
  `icon` varchar(10) DEFAULT '?',
  `color` varchar(20) DEFAULT '#EC5B13',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `title`, `description`, `level`, `duration`, `lesson_count`, `icon`, `color`, `created_at`) VALUES
(1, 'HTML & CSS', 'Build the foundation of every webpage. Learn semantic HTML5, responsive layouts, Flexbox, Grid, and modern CSS techniques used in real projects.', 'Beginner', '4 weeks', 12, '🌐', '#EC5B13', '2026-09-06 20:20:20'),
(2, 'JavaScript', 'Master the language of the web. From variables and functions to the DOM, events, fetch API, and async/await — become a JS developer.', 'Intermediate', '6 weeks', 16, '⚡', '#EC5B13', '2026-09-06 20:20:20'),
(3, 'PHP', 'Build dynamic server-side applications. Learn PHP fundamentals, MySQL integration, sessions, form handling, and REST-style PHP endpoints.', 'Intermediate', '5 weeks', 14, '🐘', '#EC5B13', '2026-09-06 20:20:20');

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `enrolled_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `enrollments`
--

INSERT INTO `enrollments` (`id`, `user_id`, `course_id`, `enrolled_at`) VALUES
(1, 1, 1, '2026-09-06 20:26:53'),
(2, 1, 2, '2026-09-06 20:29:13'),
(3, 2, 1, '2026-09-21 19:26:04');

-- --------------------------------------------------------

--
-- Table structure for table `lessons`
--

CREATE TABLE `lessons` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `module_name` varchar(150) NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` longtext NOT NULL,
  `order_num` int(11) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lessons`
--

INSERT INTO `lessons` (`id`, `course_id`, `module_name`, `title`, `content`, `order_num`) VALUES
(1, 1, 'Module 1: HTML Basics', 'Introduction to HTML', '<h2>What is HTML?</h2><p>HTML (HyperText Markup Language) is the backbone of every webpage. It defines the structure and meaning of web content using <strong>elements</strong> written as tags.</p><pre><code>&lt;!DOCTYPE html&gt;\n&lt;html&gt;\n  &lt;head&gt;\n    &lt;title&gt;My Page&lt;/title&gt;\n  &lt;/head&gt;\n  &lt;body&gt;\n    &lt;h1&gt;Hello, World!&lt;/h1&gt;\n  &lt;/body&gt;\n&lt;/html&gt;</code></pre><p>Every HTML document starts with <code>&lt;!DOCTYPE html&gt;</code> which tells the browser this is HTML5.</p>', 1),
(2, 1, 'Module 1: HTML Basics', 'HTML Elements & Tags', '<h2>HTML Elements</h2><p>An HTML element is defined by a start tag, some content, and an end tag:</p><pre><code>&lt;tagname&gt;Content goes here...&lt;/tagname&gt;</code></pre><h3>Common Tags</h3><ul><li><code>&lt;h1&gt;</code> to <code>&lt;h6&gt;</code> — Headings</li><li><code>&lt;p&gt;</code> — Paragraph</li><li><code>&lt;a href=\"\"&gt;</code> — Link</li><li><code>&lt;img src=\"\"&gt;</code> — Image</li><li><code>&lt;ul&gt;</code>, <code>&lt;ol&gt;</code>, <code>&lt;li&gt;</code> — Lists</li><li><code>&lt;div&gt;</code>, <code>&lt;span&gt;</code> — Containers</li></ul>', 2),
(3, 1, 'Module 1: HTML Basics', 'HTML Forms', '<h2>HTML Forms</h2><p>Forms allow users to input data that is sent to a server.</p><pre><code>&lt;form action=\"submit.php\" method=\"POST\"&gt;\n  &lt;label for=\"name\"&gt;Name:&lt;/label&gt;\n  &lt;input type=\"text\" id=\"name\" name=\"name\" required&gt;\n  &lt;input type=\"submit\" value=\"Submit\"&gt;\n&lt;/form&gt;</code></pre><h3>Input Types</h3><ul><li><code>text</code> — Single-line text</li><li><code>email</code> — Email address</li><li><code>password</code> — Hidden text</li><li><code>checkbox</code>, <code>radio</code> — Selections</li><li><code>submit</code> — Submit button</li></ul>', 3),
(4, 1, 'Module 2: CSS Fundamentals', 'Introduction to CSS', '<h2>What is CSS?</h2><p>CSS (Cascading Style Sheets) controls the visual presentation of HTML elements — colors, fonts, spacing, layout, and more.</p><pre><code>/* Selector { property: value; } */\nh1 {\n  color: #EC5B13;\n  font-size: 32px;\n  font-weight: bold;\n}</code></pre><h3>Three Ways to Apply CSS</h3><ol><li><strong>Inline</strong> — <code>style</code> attribute on an element</li><li><strong>Internal</strong> — <code>&lt;style&gt;</code> block in <code>&lt;head&gt;</code></li><li><strong>External</strong> — separate <code>.css</code> file (recommended)</li></ol>', 4),
(5, 1, 'Module 2: CSS Fundamentals', 'Box Model & Spacing', '<h2>The CSS Box Model</h2><p>Every HTML element is a rectangular box. The box model describes the space around it:</p><pre><code>.card {\n  width: 300px;\n  padding: 20px;   /* space inside */\n  border: 1px solid #ccc;\n  margin: 16px;    /* space outside */\n}</code></pre><p>Total width = width + padding-left + padding-right + border-left + border-right</p><h3>box-sizing</h3><p>Use <code>box-sizing: border-box</code> so padding and border are included in the width.</p>', 5),
(6, 1, 'Module 3: Layouts', 'Flexbox Layout', '<h2>CSS Flexbox</h2><p>Flexbox makes it easy to align and distribute space among items in a container.</p><pre><code>.container {\n  display: flex;\n  justify-content: space-between; /* horizontal */\n  align-items: center;            /* vertical */\n  gap: 16px;\n}</code></pre><h3>Key Properties</h3><ul><li><code>flex-direction</code> — row or column</li><li><code>justify-content</code> — main axis alignment</li><li><code>align-items</code> — cross axis alignment</li><li><code>flex-wrap</code> — wrap to next line</li></ul>', 6),
(7, 1, 'Module 3: Layouts', 'CSS Grid Layout', '<h2>CSS Grid</h2><p>Grid is a two-dimensional layout system, perfect for page-level structure.</p><pre><code>.grid {\n  display: grid;\n  grid-template-columns: repeat(3, 1fr);\n  gap: 24px;\n}</code></pre><h3>Common Patterns</h3><ul><li><code>repeat(3, 1fr)</code> — three equal columns</li><li><code>grid-column: span 2</code> — item spans two columns</li><li><code>grid-template-areas</code> — named layout areas</li></ul>', 7),
(8, 2, 'Module 1: JS Basics', 'Introduction to JavaScript', '<h2>What is JavaScript?</h2><p>JavaScript is the programming language of the web. It runs in the browser and makes pages interactive — responding to clicks, fetching data, updating content without reloading.</p><pre><code>// Your first JS line\nconsole.log(\"Hello, Codera!\");\n\n// Variables\nlet name = \"Alice\";\nconst score = 100;\nvar legacy = \"avoid this\";</code></pre>', 1),
(9, 2, 'Module 1: JS Basics', 'Functions & Scope', '<h2>Functions</h2><p>Functions are reusable blocks of code. JavaScript has several ways to define them:</p><pre><code>// Function declaration\nfunction greet(name) {\n  return \"Hello, \" + name;\n}\n\n// Arrow function\nconst greet = (name) => `Hello, ${name}`;\n\n// Call it\nconsole.log(greet(\"Alice\")); // Hello, Alice</code></pre><h3>Scope</h3><p><code>let</code> and <code>const</code> are block-scoped. <code>var</code> is function-scoped.</p>', 2),
(10, 2, 'Module 2: DOM', 'DOM Manipulation', '<h2>The Document Object Model</h2><p>The DOM represents the HTML page as a tree of objects you can read and modify with JavaScript.</p><pre><code>// Select elements\nconst btn = document.getElementById(\"myBtn\");\nconst items = document.querySelectorAll(\".item\");\n\n// Change content\nbtn.textContent = \"Clicked!\";\nbtn.style.color = \"#EC5B13\";\n\n// Add event listener\nbtn.addEventListener(\"click\", function() {\n  alert(\"Button clicked!\");\n});</code></pre>', 3),
(11, 2, 'Module 3: Async JS', 'Fetch API & JSON', '<h2>Fetch API</h2><p>Use <code>fetch()</code> to make HTTP requests to a server (your PHP files) without reloading the page.</p><pre><code>// GET request\nfetch(\"../php/courses.php\")\n  .then(response => response.json())\n  .then(data => {\n    console.log(data); // array of courses\n  })\n  .catch(err => console.error(err));\n\n// POST request\nfetch(\"../php/login.php\", {\n  method: \"POST\",\n  headers: { \"Content-Type\": \"application/json\" },\n  body: JSON.stringify({ email, password })\n}).then(r => r.json()).then(data => {\n  if (data.success) window.location.href = \"dashboard.html\";\n});</code></pre>', 4),
(12, 3, 'Module 1: PHP Basics', 'Introduction to PHP', '<h2>What is PHP?</h2><p>PHP (Hypertext Preprocessor) is a server-side scripting language designed for web development. It runs on the server (Apache/XAMPP) and generates HTML sent to the browser.</p><pre><code>&lt;?php\n  // Variables\n  $name = \"Alice\";\n  $age  = 21;\n  echo \"Hello, $name! You are $age years old.\";\n?&gt;</code></pre><h3>PHP in HTML</h3><p>You can mix PHP and HTML freely using <code>&lt;?php ... ?&gt;</code> tags.</p>', 1),
(13, 3, 'Module 1: PHP Basics', 'PHP & MySQL', '<h2>Connecting PHP to MySQL</h2><p>Use <code>mysqli</code> (MySQL Improved) to connect your PHP scripts to a MySQL database.</p><pre><code>&lt;?php\n$conn = new mysqli(\"localhost\", \"root\", \"\", \"codera_db\");\n\nif ($conn-&gt;connect_error) {\n    die(\"Connection failed: \" . $conn-&gt;connect_error);\n}\n\n// Prepared statement (safe from SQL injection)\n$stmt = $conn-&gt;prepare(\"SELECT * FROM users WHERE email = ?\");\n$stmt-&gt;bind_param(\"s\", $email);\n$stmt-&gt;execute();\n$result = $stmt-&gt;get_result();\n?&gt;</code></pre>', 2),
(14, 3, 'Module 2: PHP Sessions', 'PHP Sessions & Auth', '<h2>PHP Sessions</h2><p>Sessions let you store user data (like login status) across multiple pages.</p><pre><code>&lt;?php\nsession_start();\n\n// Store session data after login\n$_SESSION[\"user_id\"]   = $user[\"id\"];\n$_SESSION[\"user_name\"] = $user[\"full_name\"];\n\n// Check login on protected pages\nif (!isset($_SESSION[\"user_id\"])) {\n    header(\"Location: login.html\");\n    exit;\n}\n\n// Destroy session on logout\nsession_destroy();\nheader(\"Location: login.html\");\n?&gt;</code></pre>', 3);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `problems`
--

CREATE TABLE `problems` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `difficulty` enum('Easy','Medium','Hard') NOT NULL DEFAULT 'Easy',
  `example_input` text DEFAULT NULL,
  `example_output` text DEFAULT NULL,
  `hint` text DEFAULT NULL,
  `solution` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `problems`
--

INSERT INTO `problems` (`id`, `title`, `description`, `difficulty`, `example_input`, `example_output`, `hint`, `solution`) VALUES
(1, 'Sum of Two Numbers', 'Write a JavaScript function that takes two numbers as arguments and returns their sum.', 'Easy', 'add(3, 7)', '10', 'Use the + operator.', 'function add(a, b) {\n  return a + b;\n}'),
(2, 'Reverse a String', 'Write a function that takes a string and returns it reversed.', 'Easy', 'reverseStr(\"hello\")', '\"olleh\"', 'Try split(), reverse(), and join().', 'function reverseStr(s) {\n  return s.split(\"\").reverse().join(\"\");\n}'),
(3, 'FizzBuzz', 'Print numbers 1 to 100. For multiples of 3 print Fizz, for multiples of 5 print Buzz, for multiples of both print FizzBuzz.', 'Easy', 'fizzBuzz()', '1, 2, Fizz, 4, Buzz...', 'Use the modulus operator (%).', 'for (let i = 1; i <= 100; i++) {\n  if (i % 15 === 0) console.log(\"FizzBuzz\");\n  else if (i % 3 === 0) console.log(\"Fizz\");\n  else if (i % 5 === 0) console.log(\"Buzz\");\n  else console.log(i);\n}'),
(4, 'Find the Largest Number', 'Write a function that returns the largest number in an array.', 'Easy', 'findMax([3, 1, 9, 4])', '9', 'Try Math.max() with spread syntax.', 'function findMax(arr) {\n  return Math.max(...arr);\n}'),
(5, 'Check Palindrome', 'Write a function that returns true if a string is a palindrome (reads the same forwards and backwards).', 'Medium', 'isPalindrome(\"racecar\")', 'true', 'Compare the string with its reverse.', 'function isPalindrome(s) {\n  const rev = s.split(\"\").reverse().join(\"\");\n  return s === rev;\n}'),
(6, 'Count Vowels', 'Write a function that counts the number of vowels in a string.', 'Easy', 'countVowels(\"hello world\")', '3', 'Check each character against a, e, i, o, u.', 'function countVowels(str) {\n  return (str.match(/[aeiou]/gi) || []).length;\n}'),
(7, 'Fibonacci Sequence', 'Write a function that returns the first n numbers of the Fibonacci sequence.', 'Medium', 'fibonacci(6)', '[0, 1, 1, 2, 3, 5]', 'Each number is the sum of the two before it.', 'function fibonacci(n) {\n  const seq = [0, 1];\n  for (let i = 2; i < n; i++) {\n    seq.push(seq[i-1] + seq[i-2]);\n  }\n  return seq.slice(0, n);\n}'),
(8, 'Remove Duplicates', 'Write a function that removes duplicate values from an array.', 'Medium', 'removeDuplicates([1,2,2,3,3,4])', '[1, 2, 3, 4]', 'Use JavaScript Set or filter with indexOf.', 'function removeDuplicates(arr) {\n  return [...new Set(arr)];\n}');

-- --------------------------------------------------------

--
-- Table structure for table `progress`
--

CREATE TABLE `progress` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `lesson_id` int(11) NOT NULL,
  `completed_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quizzes`
--

CREATE TABLE `quizzes` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quizzes`
--

INSERT INTO `quizzes` (`id`, `course_id`, `title`) VALUES
(1, 1, 'HTML & CSS Quiz'),
(2, 2, 'JavaScript Quiz'),
(3, 3, 'PHP Quiz');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempts`
--

CREATE TABLE `quiz_attempts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `total` int(11) NOT NULL,
  `attempted_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quiz_questions`
--

CREATE TABLE `quiz_questions` (
  `id` int(11) NOT NULL,
  `quiz_id` int(11) NOT NULL,
  `question` text NOT NULL,
  `option_a` varchar(255) NOT NULL,
  `option_b` varchar(255) NOT NULL,
  `option_c` varchar(255) NOT NULL,
  `option_d` varchar(255) NOT NULL,
  `correct_option` char(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quiz_questions`
--

INSERT INTO `quiz_questions` (`id`, `quiz_id`, `question`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_option`) VALUES
(1, 1, 'What does HTML stand for?', 'Hyper Text Markup Language', 'High Tech Modern Language', 'HyperLink and Text Markup Language', 'Home Tool Markup Language', 'a'),
(2, 1, 'Which CSS property changes text color?', 'font-color', 'text-color', 'color', 'foreground-color', 'c'),
(3, 1, 'Which tag is used to create a hyperlink?', '<link>', '<a>', '<href>', '<url>', 'b'),
(4, 1, 'What does CSS stand for?', 'Cascading Style Sheets', 'Creative Style System', 'Computer Style Sheets', 'Colorful Style Syntax', 'a'),
(5, 1, 'Which property is used for Flexbox layout?', 'display: block', 'display: flex', 'display: grid', 'display: inline', 'b'),
(6, 2, 'Which keyword declares a block-scoped variable?', 'var', 'int', 'let', 'define', 'c'),
(7, 2, 'How do you select an element by ID in JavaScript?', 'document.query(\"#id\")', 'document.getElement(\"id\")', 'document.getElementById(\"id\")', 'document.findById(\"id\")', 'c'),
(8, 2, 'What does JSON stand for?', 'JavaScript Object Notation', 'Java Standard Output Node', 'JavaScript Ordered Numbers', 'Just Simple Object Naming', 'a'),
(9, 2, 'Which method converts JSON string to a JavaScript object?', 'JSON.stringify()', 'JSON.parse()', 'JSON.convert()', 'JSON.decode()', 'b'),
(10, 2, 'What is the correct way to write an arrow function?', 'function => (x) { }', 'const f = (x) => x * 2', 'arrow f(x) { return x }', 'fn f = (x) -> x * 2', 'b'),
(11, 3, 'Which symbol starts a PHP variable?', '#', '@', '$', '%', 'c'),
(12, 3, 'Which function hashes a password securely in PHP?', 'md5()', 'sha1()', 'password_hash()', 'encrypt()', 'c'),
(13, 3, 'How do you start a PHP session?', 'start_session()', 'session_start()', 'begin_session()', 'init_session()', 'b'),
(14, 3, 'Which superglobal holds POST data?', '$_GET', '$_POST', '$_REQUEST', '$_FORM', 'b'),
(15, 3, 'What is a prepared statement used for?', 'Styling output', 'Preventing SQL injection', 'Caching queries', 'Sorting results', 'b');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `avatar` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`, `avatar`, `bio`, `created_at`) VALUES
(1, 'Ahmed Jihan', 'ahmedjihan@codera.com', '$2y$12$foVf6qS43WFxVoXQ8KkSIe8PPlxLtanld7.dvnAZj1g3ghPr/mMMi', 'user', NULL, NULL, '2026-09-06 20:23:51'),
(2, 'Mehesam Rahman', 'rmehesam@gmail.com', '$2y$10$n7AR92yKpBPLjfx2RBlPEe4PpBqV5HDyuqcXzQvB7N3DaQYu48qym', 'user', NULL, NULL, '2026-09-21 17:37:34'),
(3, 'Admin', 'admin@codera.com', '$2b$12$iI9hiKVPyf9u16jBeSCjH.4.8aTmIM6KSwlcRcbqGKIH552na8icS', 'admin', NULL, NULL, '2026-09-21 18:08:22');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `community_comments`
--
ALTER TABLE `community_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `post_id` (`post_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `community_posts`
--
ALTER TABLE `community_posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_enrollment` (`user_id`,`course_id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `lessons`
--
ALTER TABLE `lessons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `problems`
--
ALTER TABLE `problems`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `progress`
--
ALTER TABLE `progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_progress` (`user_id`,`lesson_id`),
  ADD KEY `lesson_id` (`lesson_id`);

--
-- Indexes for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `course_id` (`course_id`);

--
-- Indexes for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `quiz_id` (`quiz_id`);

--
-- Indexes for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `quiz_id` (`quiz_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `community_comments`
--
ALTER TABLE `community_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `community_posts`
--
ALTER TABLE `community_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `lessons`
--
ALTER TABLE `lessons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `problems`
--
ALTER TABLE `problems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `progress`
--
ALTER TABLE `progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `community_comments`
--
ALTER TABLE `community_comments`
  ADD CONSTRAINT `community_comments_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `community_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `community_posts`
--
ALTER TABLE `community_posts`
  ADD CONSTRAINT `community_posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD CONSTRAINT `enrollments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `enrollments_ibfk_2` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lessons`
--
ALTER TABLE `lessons`
  ADD CONSTRAINT `lessons_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `progress`
--
ALTER TABLE `progress`
  ADD CONSTRAINT `progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `progress_ibfk_2` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quizzes`
--
ALTER TABLE `quizzes`
  ADD CONSTRAINT `quizzes_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD CONSTRAINT `quiz_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `quiz_attempts_ibfk_2` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  ADD CONSTRAINT `quiz_questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `quizzes` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
