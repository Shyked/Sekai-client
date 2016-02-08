<?php

require_once 'myPDO.include.php' ;

class utilisateur {
	//Déclaration des atMembrets
	//email
	private $email = null ;
	//pass
	private $pass = null ;
	

	//Méthode permettant de se connecter au site
	//@param : email - nom d'utilisateur
	//@param : pwd - mot de passe correspondant 
	public static function email($email , $pass){
	$pdo = myPDO::getInstance() ;
	$stmt = $pdo->prepare(<<<SQL
		SELECT email
		FROM Membre
		WHERE email = ?
		AND pass = ?
SQL
	) ;
		$stmt->bindValue(1,$email, PDO::PARAM_INT);
		$stmt->bindValue(2,$pwd, PDO::PARAM_INT) ;
		$stmt->execute() ;
		$array = $stmt->fetchAll() ;
		if(count($array) == 1 )
		{
			//Connexion			
			session_start();
			$_SESSION['login']= $email;
			$_SESSION['pwd']= $pwd ;
			//Récuperation des données sur le joueur
			$recupDonnee = $pdo->prepare(<<<SQL
				SELECT email
				FROM Membre
				WHERE email = ?
				AND pass = ?
SQL
	) ;
			$recupDonnee->bindValue(1,$email, PDO::PARAM_INT);
			$recupDonnee->bindValue(2,$pwd, PDO::PARAM_INT) ;
			$recupDonnee->execute() ;
			//if ($v = $recupDonnee->fetch()) {
			//Déclaration de la Membre dans la session
			$_SESSION['Membre']= Membre::createFromemail($email) ;			
		}
		else
		{
			throw new exception('Id false') ;
		}	
	}


	//Méthode permettant de se déconnecter et d'actualiser la dérnière connexion 
	public static function logout(){
		session_start() ;
		//Actualisation de la dernière connexion
		$Membre = $_SESSION['Membre'] ;
		$email = $Membre['email'] ;
		$pass = $Membre['pass'] ;		
		$heureDeco=date("Y-m-d H:i:s"); 		
		$pdo = myPDO::getInstance() ;
		$updateDate=$pdo->prepare(<<<SQL
		UPDATE Membre
		SET lastCo = ?
		WHERE email = ?
		AND pass = ?
SQL
	);
		$updateDate->bindValue(1,$heureDeco,PDO::PARAM_INT) ;
		$updateDate->bindValue(2,$email,PDO::PARAM_INT);
		$updateDate->bindValue(3,$pass,PDO::PARAM_INT);
		$updateDate->execute() ;
		//Destruction de la session
		session_destroy() ;
	}

}

