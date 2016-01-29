<?php



if (isset($_GET["world"]) && preg_match("/^([^\/\?\:\\\"\<\>\*\|]+)$/", $_GET["world"])) {
	$world = $_GET["world"];
	if (isset($_GET["image"]) && preg_match("/^([^\/\?\:\\\"\<\>\*\|]+)$/", $_GET["image"])) {
		$image = $_GET["image"];
		$folder = "../img/worlds/" . $world . "/textures/";
		$filename = $image . ".png";
		if (file_exists($folder . $filename)) {
			echo "\"true\"";
		}
		else echo "\"Image not found\"";
	}
	else echo "\"An error occured with the parameter image.\"";
}
else echo "\"An error occured with the parameter world.\"";