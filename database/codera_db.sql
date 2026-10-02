-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 02, 2026 at 09:36 PM
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
(3, 1, 'Tips for learning Flexbox faster', 'I found that building small layout challenges every day helped me understand Flexbox much better than just reading docs. Try Flexbox Froggy!', 16, '2026-09-06 20:24:13'),
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
(14, 3, 'Module 2: PHP Sessions', 'PHP Sessions & Auth', '<h2>PHP Sessions</h2><p>Sessions let you store user data (like login status) across multiple pages.</p><pre><code>&lt;?php\nsession_start();\n\n// Store session data after login\n$_SESSION[\"user_id\"]   = $user[\"id\"];\n$_SESSION[\"user_name\"] = $user[\"full_name\"];\n\n// Check login on protected pages\nif (!isset($_SESSION[\"user_id\"])) {\n    header(\"Location: login.html\");\n    exit;\n}\n\n// Destroy session on logout\nsession_destroy();\nheader(\"Location: login.html\");\n?&gt;</code></pre>', 3),
(15, 1, 'Module 2: CSS Fundamentals', 'CSS Padding', '', 3),
(16, 1, 'Module 2: CSS Fundamentals', 'CSS padding', 'The CSS padding properties are used to generate space around an element\'s content, inside of any defined borders.\n<pre><code>div {\n  padding-top: 50px;\n  padding-right: 30px;\n  padding-bottom: 50px;\n  padding-left: 80px;\n}</code></pre>\n\nWith CSS, you have full control over the padding. There are properties for setting the padding for each side of an element (top, right, bottom, and left), and a shorthand property for setting all the padding properties in one declaration.\n\n', 8);

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

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `is_read`, `created_at`) VALUES
(1, 1, 'New Module/Lesson Uploaded', 'A new module/lesson \'CSS Padding\' (Module 2: CSS Fundamentals) was added to HTML & CSS!', 0, '2026-09-21 17:26:06'),
(2, 2, 'New Module/Lesson Uploaded', 'A new module/lesson \'CSS Padding\' (Module 2: CSS Fundamentals) was added to HTML & CSS!', 1, '2026-09-21 17:26:06'),
(3, 1, 'New Module/Lesson Uploaded', 'A new module/lesson \'CSS padding\' (Module 2: CSS Fundamentals) was added to HTML & CSS!', 0, '2026-09-21 17:28:17'),
(4, 2, 'New Module/Lesson Uploaded', 'A new module/lesson \'CSS padding\' (Module 2: CSS Fundamentals) was added to HTML & CSS!', 1, '2026-09-21 17:28:17'),
(5, 1, 'Module/Lesson Updated', 'The module/lesson \'CSS padding\' in HTML & CSS has been updated.', 0, '2026-09-21 18:42:31'),
(6, 2, 'Module/Lesson Updated', 'The module/lesson \'CSS padding\' in HTML & CSS has been updated.', 1, '2026-09-21 18:42:31'),
(7, 1, 'Module/Lesson Updated', 'The module/lesson \'CSS padding\' in HTML & CSS has been updated.', 0, '2026-09-21 18:43:52'),
(8, 2, 'Module/Lesson Updated', 'The module/lesson \'CSS padding\' in HTML & CSS has been updated.', 1, '2026-09-21 18:43:52');

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
(1, 'Sum of Two Numbers', 'Write a JavaScript function that takes two numbers as arguments and returns their sum. [C/C++: read two integers a and b; print their sum.]', 'Easy', 'add(3, 7)', '10', 'Use the + operator.', 'function add(a, b) {\n  return a + b;\n}'),
(2, 'Reverse a String', 'Write a function that takes a string and returns it reversed. [C/C++: read one line of text (use getline); print it reversed.]', 'Easy', 'reverseStr(\"hello\")', '\"olleh\"', 'Try split(), reverse(), and join().', 'function reverseStr(s) {\n  return s.split(\"\").reverse().join(\"\");\n}'),
(3, 'FizzBuzz', 'Print numbers 1 to 100. For multiples of 3 print Fizz, for multiples of 5 print Buzz, for multiples of both print FizzBuzz. [C/C++: read an integer N; print the numbers 1 to N, one per line.]', 'Easy', 'fizzBuzz()', '1, 2, Fizz, 4, Buzz...', 'Use the modulus operator (%).', 'for (let i = 1; i <= 100; i++) {\n  if (i % 15 === 0) console.log(\"FizzBuzz\");\n  else if (i % 3 === 0) console.log(\"Fizz\");\n  else if (i % 5 === 0) console.log(\"Buzz\");\n  else console.log(i);\n}'),
(4, 'Find the Largest Number', 'Write a function that returns the largest number in an array. [C/C++: first read n, then n integers; print the largest.]', 'Easy', 'findMax([3, 1, 9, 4])', '9', 'Try Math.max() with spread syntax.', 'function findMax(arr) {\n  return Math.max(...arr);\n}'),
(5, 'Check Palindrome', 'Write a function that returns true if a string is a palindrome (reads the same forwards and backwards). [C/C++: read one word; print true or false.]', 'Medium', 'isPalindrome(\"racecar\")', 'true', 'Compare the string with its reverse.', 'function isPalindrome(s) {\n  const rev = s.split(\"\").reverse().join(\"\");\n  return s === rev;\n}'),
(6, 'Count Vowels', 'Write a function that counts the number of vowels in a string. [C/C++: read one line of text (use getline); print the number of vowels, upper or lower case.]', 'Easy', 'countVowels(\"hello world\")', '3', 'Check each character against a, e, i, o, u.', 'function countVowels(str) {\n  return (str.match(/[aeiou]/gi) || []).length;\n}'),
(7, 'Fibonacci Sequence', 'Write a function that returns the first n numbers of the Fibonacci sequence. [C/C++: read n; print the first n Fibonacci numbers on one line, separated by spaces.]', 'Medium', 'fibonacci(6)', '[0, 1, 1, 2, 3, 5]', 'Each number is the sum of the two before it.', 'function fibonacci(n) {\n  const seq = [0, 1];\n  for (let i = 2; i < n; i++) {\n    seq.push(seq[i-1] + seq[i-2]);\n  }\n  return seq.slice(0, n);\n}'),
(8, 'Remove Duplicates', 'Write a function that removes duplicate values from an array. [C/C++: first read n, then n integers; print them without duplicates, in original order, separated by spaces.]', 'Medium', 'removeDuplicates([1,2,2,3,3,4])', '[1, 2, 3, 4]', 'Use JavaScript Set or filter with indexOf.', 'function removeDuplicates(arr) {\n  return [...new Set(arr)];\n}');

-- --------------------------------------------------------

--
-- Table structure for table `problem_test_cases`
--

CREATE TABLE `problem_test_cases` (
  `id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `input` text NOT NULL,
  `expected_output` text NOT NULL,
  `is_sample` tinyint(1) NOT NULL DEFAULT 0,
  `order_num` int(11) NOT NULL DEFAULT 0,
  `kind` varchar(10) NOT NULL DEFAULT 'js'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `problem_test_cases`
--

INSERT INTO `problem_test_cases` (`id`, `problem_id`, `input`, `expected_output`, `is_sample`, `order_num`, `kind`) VALUES
(1, 1, 'add(3, 7)', '10', 1, 0, 'js'),
(2, 1, 'add(-5, 5)', '0', 0, 1, 'js'),
(3, 1, 'add(100, 250)', '350', 0, 2, 'js'),
(4, 2, 'reverseStr(\"hello\")', '\"olleh\"', 1, 0, 'js'),
(5, 2, 'reverseStr(\"a\")', '\"a\"', 0, 1, 'js'),
(6, 2, 'reverseStr(\"Codera\")', '\"aredoC\"', 0, 2, 'js'),
(7, 3, 'fizzBuzz()', '1\r\n2\r\nFizz\r\n4\r\nBuzz\r\nFizz\r\n7\r\n8\r\nFizz\r\nBuzz\r\n11\r\nFizz\r\n13\r\n14\r\nFizzBuzz\r\n16\r\n17\r\nFizz\r\n19\r\nBuzz\r\nFizz\r\n22\r\n23\r\nFizz\r\nBuzz\r\n26\r\nFizz\r\n28\r\n29\r\nFizzBuzz\r\n31\r\n32\r\nFizz\r\n34\r\nBuzz\r\nFizz\r\n37\r\n38\r\nFizz\r\nBuzz\r\n41\r\nFizz\r\n43\r\n44\r\nFizzBuzz\r\n46\r\n47\r\nFizz\r\n49\r\nBuzz\r\nFizz\r\n52\r\n53\r\nFizz\r\nBuzz\r\n56\r\nFizz\r\n58\r\n59\r\nFizzBuzz\r\n61\r\n62\r\nFizz\r\n64\r\nBuzz\r\nFizz\r\n67\r\n68\r\nFizz\r\nBuzz\r\n71\r\nFizz\r\n73\r\n74\r\nFizzBuzz\r\n76\r\n77\r\nFizz\r\n79\r\nBuzz\r\nFizz\r\n82\r\n83\r\nFizz\r\nBuzz\r\n86\r\nFizz\r\n88\r\n89\r\nFizzBuzz\r\n91\r\n92\r\nFizz\r\n94\r\nBuzz\r\nFizz\r\n97\r\n98\r\nFizz\r\nBuzz', 1, 0, 'js'),
(8, 4, 'findMax([3, 1, 9, 4])', '9', 1, 0, 'js'),
(9, 4, 'findMax([-10, -2, -33])', '-2', 0, 1, 'js'),
(10, 4, 'findMax([5])', '5', 0, 2, 'js'),
(11, 5, 'isPalindrome(\"racecar\")', 'true', 1, 0, 'js'),
(12, 5, 'isPalindrome(\"hello\")', 'false', 0, 1, 'js'),
(13, 5, 'isPalindrome(\"a\")', 'true', 0, 2, 'js'),
(14, 6, 'countVowels(\"hello world\")', '3', 1, 0, 'js'),
(15, 6, 'countVowels(\"xyz\")', '0', 0, 1, 'js'),
(16, 6, 'countVowels(\"AEIOU\")', '5', 0, 2, 'js'),
(17, 7, 'fibonacci(6)', '[0, 1, 1, 2, 3, 5]', 1, 0, 'js'),
(18, 7, 'fibonacci(1)', '[0]', 0, 1, 'js'),
(19, 7, 'fibonacci(2)', '[0, 1]', 0, 2, 'js'),
(20, 8, 'removeDuplicates([1,2,2,3,3,4])', '[1, 2, 3, 4]', 1, 0, 'js'),
(21, 8, 'removeDuplicates([1,1,1])', '[1]', 0, 1, 'js'),
(22, 8, 'removeDuplicates([5,4,3,2,1])', '[5, 4, 3, 2, 1]', 0, 2, 'js'),
(23, 1, '3 7', '10', 1, 1, 'stdio'),
(24, 1, '-5 12', '7', 0, 2, 'stdio'),
(25, 1, '0 0', '0', 0, 3, 'stdio'),
(26, 1, '1000000 2345678', '3345678', 0, 4, 'stdio'),
(27, 2, 'hello', 'olleh', 1, 1, 'stdio'),
(28, 2, 'Codera', 'aredoC', 0, 2, 'stdio'),
(29, 2, 'a b c', 'c b a', 0, 3, 'stdio'),
(30, 2, '12345', '54321', 0, 4, 'stdio'),
(31, 3, '15', '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz', 1, 1, 'stdio'),
(32, 3, '100', '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n16\n17\nFizz\n19\nBuzz\nFizz\n22\n23\nFizz\nBuzz\n26\nFizz\n28\n29\nFizzBuzz\n31\n32\nFizz\n34\nBuzz\nFizz\n37\n38\nFizz\nBuzz\n41\nFizz\n43\n44\nFizzBuzz\n46\n47\nFizz\n49\nBuzz\nFizz\n52\n53\nFizz\nBuzz\n56\nFizz\n58\n59\nFizzBuzz\n61\n62\nFizz\n64\nBuzz\nFizz\n67\n68\nFizz\nBuzz\n71\nFizz\n73\n74\nFizzBuzz\n76\n77\nFizz\n79\nBuzz\nFizz\n82\n83\nFizz\nBuzz\n86\nFizz\n88\n89\nFizzBuzz\n91\n92\nFizz\n94\nBuzz\nFizz\n97\n98\nFizz\nBuzz', 0, 2, 'stdio'),
(33, 3, '5', '1\n2\nFizz\n4\nBuzz', 0, 3, 'stdio'),
(34, 3, '1', '1', 0, 4, 'stdio'),
(35, 4, '4\n3 1 9 4', '9', 1, 1, 'stdio'),
(36, 4, '5\n-8 -3 -20 -1 -7', '-1', 0, 2, 'stdio'),
(37, 4, '1\n42', '42', 0, 3, 'stdio'),
(38, 4, '6\n10 10 2 10 5 7', '10', 0, 4, 'stdio'),
(39, 5, 'racecar', 'true', 1, 1, 'stdio'),
(40, 5, 'hello', 'false', 0, 2, 'stdio'),
(41, 5, 'level', 'true', 0, 3, 'stdio'),
(42, 5, 'a', 'true', 0, 4, 'stdio'),
(43, 6, 'hello world', '3', 1, 1, 'stdio'),
(44, 6, 'AEIOU', '5', 0, 2, 'stdio'),
(45, 6, 'rhythm', '0', 0, 3, 'stdio'),
(46, 6, 'Programming Is Fun', '5', 0, 4, 'stdio'),
(47, 7, '6', '0 1 1 2 3 5', 1, 1, 'stdio'),
(48, 7, '1', '0', 0, 2, 'stdio'),
(49, 7, '2', '0 1', 0, 3, 'stdio'),
(50, 7, '10', '0 1 1 2 3 5 8 13 21 34', 0, 4, 'stdio'),
(51, 8, '6\n1 2 2 3 3 4', '1 2 3 4', 1, 1, 'stdio'),
(52, 8, '5\n5 5 5 5 5', '5', 0, 2, 'stdio'),
(53, 8, '4\n7 1 7 1', '7 1', 0, 3, 'stdio'),
(54, 8, '7\n9 8 9 7 8 6 7', '9 8 7 6', 0, 4, 'stdio');

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
  `module_name` varchar(150) DEFAULT NULL,
  `title` varchar(200) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `quizzes`
--

INSERT INTO `quizzes` (`id`, `course_id`, `module_name`, `title`) VALUES
(1, 1, NULL, 'HTML & CSS Quiz'),
(2, 2, NULL, 'JavaScript Quiz'),
(3, 3, NULL, 'PHP Quiz'),
(4, 1, 'Module 1: HTML Basics', 'Module 1: HTML Basics Quiz'),
(5, 1, 'Module 2: CSS Fundamentals', 'Module 2: CSS Fundamentals Quiz'),
(6, 1, 'Module 3: Layouts', 'Module 3: Layouts Quiz'),
(7, 2, 'Module 1: JS Basics', 'Module 1: JS Basics Quiz'),
(8, 2, 'Module 2: DOM', 'Module 2: DOM Quiz'),
(9, 2, 'Module 3: Async JS', 'Module 3: Async JS Quiz'),
(10, 3, 'Module 1: PHP Basics', 'Module 1: PHP Basics Quiz'),
(11, 3, 'Module 2: PHP Sessions', 'Module 2: PHP Sessions Quiz');

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

--
-- Dumping data for table `quiz_attempts`
--

INSERT INTO `quiz_attempts` (`id`, `user_id`, `quiz_id`, `score`, `total`, `attempted_at`) VALUES
(1, 2, 4, 4, 5, '2026-09-26 03:36:43'),
(2, 2, 5, 1, 5, '2026-09-26 04:23:08');

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
(15, 3, 'What is a prepared statement used for?', 'Styling output', 'Preventing SQL injection', 'Caching queries', 'Sorting results', 'b'),
(16, 4, 'Which element contains the visible content of an HTML page?', '<head>', '<title>', '<body>', '<meta>', 'c'),
(17, 4, 'Which tag creates the largest heading?', '<h1>', '<h6>', '<head>', '<heading>', 'a'),
(18, 4, 'Which attribute provides alternative text for an image?', 'title', 'src', 'caption', 'alt', 'd'),
(19, 4, 'Which input type hides the characters a user types?', 'type=\"text\"', 'type=\"password\"', 'type=\"secret\"', 'type=\"hidden\"', 'b'),
(20, 4, 'Which <form> attribute sets how the data is sent (GET or POST)?', 'action', 'target', 'method', 'name', 'c'),
(21, 5, 'Which selector targets the element with id=\"menu\"?', '.menu', '#menu', 'menu', '*menu', 'b'),
(22, 5, 'What is the correct box model order from the inside out?', 'margin, border, padding, content', 'content, border, padding, margin', 'padding, content, margin, border', 'content, padding, border, margin', 'd'),
(23, 5, 'Which property adds space INSIDE an element, between its content and its border?', 'padding', 'margin', 'outline', 'border-spacing', 'a'),
(24, 5, 'Which is correct CSS syntax?', 'body: color = black;', '{ body; color: black }', 'body { color: black; }', 'body { color = black }', 'c'),
(25, 5, 'What does box-sizing: border-box do?', 'Width and height include padding and border', 'Removes the element\'s border', 'Adds the margin to the width', 'Turns the element into a flex container', 'a'),
(26, 6, 'Which property aligns flex items along the main axis?', 'align-items', 'justify-content', 'flex-wrap', 'z-index', 'b'),
(27, 6, 'Which declaration creates a grid container?', 'display: table', 'grid: container', 'position: grid', 'display: grid', 'd'),
(28, 6, 'Which property defines the columns of a grid?', 'grid-columns', 'column-layout', 'grid-template-columns', 'grid-cols', 'c'),
(29, 6, 'Which declaration lets flex items wrap onto multiple lines?', 'flex-wrap: wrap', 'flex-direction: wrap', 'justify-content: wrap', 'flex-grow: wrap', 'a'),
(30, 6, 'In CSS Grid, what does the fr unit represent?', 'A fixed pixel size', 'A font-relative size', 'A frame rate', 'A fraction of the available space', 'd'),
(31, 7, 'Which keyword declares a variable that cannot be reassigned?', 'var', 'const', 'let', 'static', 'b'),
(32, 7, 'What does typeof \"hello\" return?', '\"text\"', '\"char\"', '\"string\"', '\"object\"', 'c'),
(33, 7, 'Which operator checks both value and type equality?', '==', '===', '=', '!=', 'b'),
(34, 7, 'What does a function return when it has no return statement?', 'null', '0', 'false', 'undefined', 'd'),
(35, 7, 'Where can a variable declared with let inside a function be used?', 'Only inside the block or function where it is declared', 'Anywhere in the file', 'Only in other functions', 'Only in the global scope', 'a'),
(36, 8, 'What does DOM stand for?', 'Data Output Method', 'Display Object Mode', 'Document Object Model', 'Document Order Map', 'c'),
(37, 8, 'Which method returns the first element that matches a CSS selector?', 'querySelector()', 'getElementByCss()', 'selectFirst()', 'findElement()', 'a'),
(38, 8, 'Which property sets the plain text of an element?', 'text', 'textContent', 'value', 'htmlText', 'b'),
(39, 8, 'Which method attaches a click handler to an element?', 'attachClick()', 'onEvent()', 'listen()', 'addEventListener()', 'd'),
(40, 8, 'Which method adds a new element as the last child of a parent?', 'insertFirst()', 'addChild()', 'appendChild()', 'pushChild()', 'c'),
(41, 9, 'Which function makes a network request in modern browsers?', 'fetch()', 'request()', 'getData()', 'ajaxCall()', 'a'),
(42, 9, 'What does fetch() return?', 'A string', 'A callback', 'An array', 'A Promise', 'd'),
(43, 9, 'Which keyword pauses an async function until a Promise settles?', 'pause', 'await', 'wait', 'yield', 'b'),
(44, 9, 'Which method converts a JavaScript object into a JSON string?', 'JSON.parse()', 'JSON.toString()', 'JSON.stringify()', 'JSON.encode()', 'c'),
(45, 9, 'Which keyword must appear before a function that uses await?', 'defer', 'async', 'promise', 'await', 'b'),
(46, 10, 'Which tags enclose PHP code?', '<script php>', '<% ... %>', '{php} ... {/php}', '<?php ... ?>', 'd'),
(47, 10, 'Which statement outputs text in PHP?', 'echo', 'print_out', 'console.log', 'write', 'a'),
(48, 10, 'Which is the correct way to open a MySQL connection with the mysqli extension?', 'mysql_connect($host)', 'connect_db($host)', 'new mysqli($host, $user, $pass, $db)', 'pdo_open($host)', 'c'),
(49, 10, 'Which operator joins (concatenates) two strings in PHP?', '.', '+', '&', ',', 'a'),
(50, 10, 'Which property gives the number of rows in a mysqli result?', '$result->count()', '$result->num_rows', '$result->length', '$result->size', 'b'),
(51, 11, 'Which function checks a plain-text password against a stored hash?', 'password_check()', 'verify_hash()', 'hash_equals_password()', 'password_verify()', 'd'),
(52, 11, 'Where is PHP session data kept between requests?', 'Only in the page URL', 'In the HTML source of each page', 'On the server, linked to the browser by a session ID cookie', 'Inside the CSS file', 'c'),
(53, 11, 'Which function removes all data of the current session?', 'session_destroy()', 'session_end()', 'session_remove()', 'unset_session()', 'a'),
(54, 11, 'Calling session_regenerate_id(true) after login helps prevent which attack?', 'SQL injection', 'Cross-site scripting', 'Password guessing', 'Session fixation', 'd'),
(55, 11, 'Which superglobal array stores session variables?', '$_SERVER', '$_SESSION', '$_FILES', '$_ENV', 'b'),
(56, 4, 'Which tag creates an ordered (numbered) list?', '<ul>', '<li>', '<ol>', '<dl>', 'c'),
(57, 4, 'Which attribute uniquely identifies one element for CSS/JS targeting?', 'class', 'name', 'key', 'id', 'd'),
(58, 4, 'Which HTML5 tag holds the main navigation links of a page?', '<nav>', '<header>', '<section>', '<aside>', 'a'),
(59, 4, 'Inside a form, which input type creates a submit button?', 'type=\"button\"', 'type=\"submit\"', 'type=\"send\"', 'type=\"action\"', 'b'),
(60, 5, 'Which unit is relative to the root element\'s font size?', 'em', 'px', 'rem', 'vh', 'c'),
(61, 5, 'Which property controls the space OUTSIDE an element\'s border?', 'margin', 'padding', 'border', 'gap', 'a'),
(62, 5, 'Which pseudo-class applies while the mouse pointer is over an element?', ':focus', ':hover', ':active', ':visited', 'b'),
(63, 5, 'Which position value takes an element out of normal flow and places it relative to its nearest positioned ancestor?', 'static', 'relative', 'fixed', 'absolute', 'd'),
(64, 6, 'Which flexbox property sets the direction items are laid out (row or column)?', 'align-content', 'flex-wrap', 'flex-direction', 'order', 'c'),
(65, 6, 'Which CSS Grid property defines the size of rows?', 'grid-template-columns', 'grid-row-gap', 'grid-area', 'grid-template-rows', 'd'),
(66, 6, 'Which flexbox property centers items along the cross axis?', 'align-items', 'justify-content', 'flex-basis', 'order', 'a'),
(67, 6, 'Which value makes a flex item grow to fill available space?', 'flex-shrink: 1', 'flex-grow: 1', 'flex-basis: 1', 'order: 1', 'b'),
(68, 7, 'Which keyword declares a block-scoped variable?', 'var', 'int', 'define', 'let', 'd'),
(69, 7, 'Which function converts a string to an integer in JavaScript?', 'Number.round()', 'toInteger()', 'parseInt()', 'Math.int()', 'c'),
(70, 7, 'What does typeof null return?', '\"object\"', '\"null\"', '\"undefined\"', '\"number\"', 'a'),
(71, 7, 'What is a function that keeps access to its outer scope\'s variables even after that scope has finished called?', 'A callback', 'A closure', 'A promise', 'A prototype', 'b'),
(72, 7, 'Which array method adds one or more items to the END of an array?', 'pop()', 'shift()', 'unshift()', 'push()', 'd'),
(73, 8, 'Which method creates a brand-new element that isn\'t yet in the page?', 'document.newElement()', 'document.addElement()', 'document.createElement()', 'document.insertElement()', 'c'),
(74, 8, 'Which property sets an element\'s inline CSS directly from JavaScript?', 'element.css', 'element.class', 'element.design', 'element.style', 'd'),
(75, 8, 'Which method removes an element from the DOM?', 'element.remove()', 'element.delete()', 'element.destroy()', 'element.clear()', 'a'),
(76, 8, 'Which method returns ALL elements that match a CSS selector, not just the first?', 'document.querySelector()', 'document.querySelectorAll()', 'document.getAll()', 'document.selectElements()', 'b'),
(77, 9, 'Which fetch() response method parses the body as JSON?', 'response.text()', 'response.parse()', 'response.json()', 'response.data()', 'c'),
(78, 9, 'Which HTTP method is typically used to CREATE a new resource?', 'POST', 'GET', 'DELETE', 'HEAD', 'a'),
(79, 9, 'What does Promise.all() do?', 'Waits only for the first to resolve', 'Waits for every promise to resolve, or for one to reject', 'Runs the promises one at a time', 'Cancels every promise but the last', 'b'),
(80, 9, 'Which status code range generally means a fetch request succeeded?', '300-399', '400-499', '500-599', '200-299', 'd'),
(81, 10, 'Which array function returns the number of elements in an array?', 'length()', 'size()', 'count()', 'array_length()', 'c'),
(82, 10, 'Which PHP superglobal holds data sent via the URL query string?', '$_POST', '$_REQUEST', '$_QUERY', '$_GET', 'd'),
(83, 10, 'Which function opens a MySQL connection with the mysqli extension?', 'mysqli_connect()', 'mysql_open()', 'db_connect()', 'new_connection()', 'a'),
(84, 10, 'Which operator checks value AND type equality in PHP?', '==', '===', '<>', 'eq', 'b'),
(85, 11, 'Where must session_start() be called for a session to work correctly?', 'After the <body> tag', 'Only inside functions', 'Before any HTML output is sent', 'At the very end of the script', 'c'),
(86, 11, 'Which superglobal stores server-side data for a logged-in user across pages?', '$_SESSION', '$_COOKIE', '$_ENV', '$_GLOBALS', 'a'),
(87, 11, 'What is the main risk of storing a plain-text password instead of a hash?', 'It uses more storage space', 'Anyone with database access can read every user\'s password', 'It makes login slower', 'It breaks session_start()', 'b'),
(88, 11, 'Besides session_destroy(), what should also be done to fully log a user out?', 'Call session_start() again', 'Restart the web server', 'Delete the user\'s row from the users table', 'Clear (unset) the $_SESSION array', 'd'),
(89, 4, 'Which tag is used to embed an image in a page?', '<src>', '<img>', '<image>', '<pic>', 'b'),
(90, 5, 'Which CSS property sets the background color of an element?', 'color', 'background-color', 'bg-color', 'background-fill', 'b'),
(91, 6, 'Which flexbox property changes the order items appear in, without changing the HTML?', 'flex-order', 'position', 'order', 'flex-index', 'c'),
(92, 8, 'Which method attaches to the DOM and copies an existing element, including its children?', 'element.copyNode()', 'element.cloneNode()', 'element.duplicate()', 'element.replicate()', 'b'),
(93, 9, 'What kind of object does an async function always return?', 'A callback', 'An array', 'A Promise', 'A string', 'c'),
(94, 10, 'Which PHP function checks whether a variable is empty?', 'is_empty()', 'empty()', 'null()', 'blank()', 'b'),
(95, 11, 'Why should you never build a SQL query by directly inserting user input into the query string?', 'It runs slower than a prepared statement', 'It opens the door to SQL injection', 'PHP does not allow it', 'It only works with MySQL, not MariaDB', 'b');

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `code` text NOT NULL,
  `verdict` enum('Accepted','Wrong Answer','Runtime Error','Compile Error') NOT NULL,
  `passed_count` int(11) NOT NULL DEFAULT 0,
  `total_count` int(11) NOT NULL DEFAULT 0,
  `submitted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `language` varchar(12) NOT NULL DEFAULT 'javascript'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `submissions`
--

INSERT INTO `submissions` (`id`, `user_id`, `problem_id`, `code`, `verdict`, `passed_count`, `total_count`, `submitted_at`, `language`) VALUES
(1, 2, 5, 'function isPalindrome(s) {\n  const rev = s.split(\"\").reverse().join(\"\");\n  return s === rev;\n}\nreturn (isPalindrome(\"racecar\"));', 'Wrong Answer', 2, 3, '2026-10-03 00:50:36', 'javascript'),
(2, 2, 8, '#include <iostream>\n#include <vector>\n#include <unordered_set>\nusing namespace std;\n\nint main() {\n  int n;\n  cin >> n;\n\n  vector<int> arr(n);\n  for (int i = 0; i < n; i++) cin >> arr[i];\n\n  unordered_set<int> seen;\n  vector<int> result;\n  for (int x : arr) {\n    if (seen.insert(x).second) {   // true only the first time we see x\n      result.push_back(x);\n    }\n  }\n\n  for (size_t i = 0; i < result.size(); i++) {\n    if (i > 0) cout << \" \";\n    cout << result[i];\n  }\n  cout << endl;\n  return 0;\n}', 'Runtime Error', 0, 3, '2026-10-03 01:10:26', 'javascript');

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
-- Indexes for table `problem_test_cases`
--
ALTER TABLE `problem_test_cases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `problem_id` (`problem_id`);

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
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `problem_id` (`problem_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `problems`
--
ALTER TABLE `problems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `problem_test_cases`
--
ALTER TABLE `problem_test_cases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `progress`
--
ALTER TABLE `progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `quizzes`
--
ALTER TABLE `quizzes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `quiz_questions`
--
ALTER TABLE `quiz_questions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- Constraints for table `problem_test_cases`
--
ALTER TABLE `problem_test_cases`
  ADD CONSTRAINT `problem_test_cases_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;

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

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
