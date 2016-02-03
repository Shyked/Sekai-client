<?php


function getFolderImages($root, &$imgList, $folderName) {
	if (is_dir($root . $folderName) && $folder = opendir($root . $folderName)) {
		while (false !== ($file = readdir($folder))) {
			$file = iconv( "iso-8859-1", "utf-8", $file);
			$explode = explode(".", $file);
			$ext = end($explode);
			if ($file != '.' && $file != '..') {
				if ($ext == "png" || $ext == "jpg" || $ext == "jpeg") array_push($imgList, $folderName . $file);
				if (is_dir($root . $folderName . $file)) getFolderImages($root, $imgList, $folderName . $file . "/");
			}
		}
	}
}

function getFolderAudio($root, &$audioList, $folderName) {
	if (is_dir($root . $folderName) && $folder = opendir($root . $folderName)) {
		while (false !== ($file = readdir($folder))) {
			$file = iconv( "iso-8859-1", "utf-8", $file);
			$explode = explode(".", $file);
			$ext = end($explode);
			if ($file != '.' && $file != '..') {
				if ($ext == "mp3" || $ext == "m4a" || $ext == "ogg") array_push($audioList, $folderName . $file);
				if (is_dir($root . $folderName . $file)) getFolderAudio($root, $audioList, $folderName . $file . "/");
			}
		}
	}
}


if (isset($_GET["world"]) && preg_match("/^([^\/\?\:\\\"\<\>\*\|]+)$/", $_GET["world"])) {

	$files = array(
		"audio" => array(),
		"images" => array()
	);

	getFolderImages("../", $files["images"], "img/worlds/" . $_GET["world"] . "/");
	getFolderAudio("../", $files["audio"], "audio/worlds/" . $_GET["world"] . "/");
	header("Content-type: application/json");
	echo json_encode($files);
}
else {
	header("Content-type: application/json");
	echo json_encode("null");
}