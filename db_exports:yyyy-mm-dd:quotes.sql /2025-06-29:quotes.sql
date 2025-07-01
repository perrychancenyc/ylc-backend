-- -------------------------------------------------------------
-- TablePlus 6.6.5(626)
--
-- https://tableplus.com/
--
-- Database: yourlocalcraftsman
-- Generation Time: 2025-06-29 22:48:47.8160
-- -------------------------------------------------------------


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


DROP TABLE IF EXISTS `quotes`;
CREATE TABLE `quotes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `service` varchar(100) DEFAULT NULL,
  `budget_min` varchar(50) DEFAULT NULL,
  `budget_max` varchar(50) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `image_url` text,
  `image_name` varchar(255) DEFAULT NULL,
  `image_type` varchar(100) DEFAULT NULL,
  `image_url_1` text,
  `image_name_1` varchar(255) DEFAULT NULL,
  `image_type_1` varchar(100) DEFAULT NULL,
  `image_url_2` text,
  `image_name_2` varchar(255) DEFAULT NULL,
  `image_type_2` varchar(100) DEFAULT NULL,
  `image_url_3` text,
  `image_name_3` varchar(255) DEFAULT NULL,
  `image_type_3` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `quotes` (`id`, `name`, `phone`, `email`, `service`, `budget_min`, `budget_max`, `description`, `created_at`, `image_url`, `image_name`, `image_type`, `image_url_1`, `image_name_1`, `image_type_1`, `image_url_2`, `image_name_2`, `image_type_2`, `image_url_3`, `image_name_3`, `image_type_3`, `location`) VALUES
(1, 'Perry Chance', '9172569721', '', NULL, NULL, NULL, NULL, '2025-06-26 16:35:23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 'Perry Chance', '9172569721', '', 'carpentry', '0', '0', 'I lvoe my wife!!!!I lvoe my wife!!!!I lvoe my wife!!!!I lvoe my wife!!!!I lvoe my wife!!!!I lvoe my wife!!!!I lvoe my wife!!!!', '2025-06-26 19:26:22', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '11111'),
(3, 'Perry', '134214541324', '', 'plumbing', '0', '0', 'I have a leak shit is coming out of the toilet I need to fix', '2025-06-26 19:27:36', 'uploads/1750991256704-Screenshot 2025-06-26 at 7.16.18â¯PM.png', 'Screenshot 2025-06-26 at 7.16.18â¯PM.png', 'image/png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '11111'),
(4, 'Perry Chance', '9172569721', '', 'general', '0', '0', 'testing the microphone in Chrometesting more', '2025-06-26 19:58:55', 'uploads/1750993135517-Screenshot 2025-06-26 at 7.02.25â¯PM.png', 'Screenshot 2025-06-26 at 7.02.25â¯PM.png', 'image/png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '11111'),
(5, 'Perry Chance', '9172569721', '', 'carpentry', '0', '0', 'Testing I love my wife Testing I love my wife Testing I love my wife Testing I love my wife Testing I love my wife Testing I love my wife Testing I love my wife Testing I love my wife ', '2025-06-26 20:10:19', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '11111'),
(6, 'Perry Chance', '9172569721', '', 'carpentry', '0', '0', 'asfasfasdfasdfasdfsadf', '2025-06-26 20:15:11', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '11111'),
(7, 'Perry Chance', '9172569721', '', 'carpentry', '0', '0', 'sadfasdfasdfasdf', '2025-06-26 20:18:22', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '11111'),
(8, 'Hoi Kwong Chan', '9172569721', '', 'plumbing', '0', '0', 'asfasfasdf', '2025-06-26 20:18:43', 'uploads/1750994323644-Screenshot 2025-06-26 at 7.02.25â¯PM.png', 'Screenshot 2025-06-26 at 7.02.25â¯PM.png', 'image/png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '11111'),
(9, 'Perry Chance', '9172569721', '', 'carpentry', '0', '0', 'sadfasdfasdfasdfasdf', '2025-06-26 20:20:14', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Daly City, CA, USA'),
(10, 'Perry Chance', '9172569721', '', 'carpentry', '0', '0', 'asdasfasdf', '2025-06-26 20:21:12', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '11111'),
(11, 'Perry Chance', '9172569721', '', 'carpentry', '0', '0', 'sadfasdfasdf', '2025-06-26 20:36:42', 'uploads/1750995402800-Screenshot 2025-06-26 at 8.28.59â¯PM.png', 'Screenshot 2025-06-26 at 8.28.59â¯PM.png', 'image/png', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '11111'),
(12, 'Perry Chance', '9172569721', '', 'plumbing', '0', '0', 'asfasdfasfadf', '2025-06-26 22:01:59', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '11111'),
(13, 'afdfsdaf', 'sadfasdfasdf', '', 'plumbing', '0', '0', 'sadfadfasdf', '2025-06-26 22:05:27', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'asdfasdf'),
(14, 'sdfasdfsadf', 'dsfsadfasdf', '', 'carpentry', '0', '0', 'dfasdf', '2025-06-26 22:08:10', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'dsfasdf'),
(15, 'Perry Chance', '9172569721', '', 'carpentry', '0', '0', 'sdaasdfdsafdsf', '2025-06-27 11:01:03', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '11111'),
(16, 'Perry Chance', '888-888-8888', 'perrychancenyc@gmail.com', 'plumbing', '0', '0', 'sfasdfasdftesting microphone testing microphone', '2025-06-27 15:20:27', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '90266');



/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;