# Sécurité / Security policy

## Signaler une faille

Merci de **ne pas ouvrir d'issue publique** pour un problème de sécurité.

Signale-le en privé sur GitHub : **Security → Report a vulnerability** sur ce dépôt. Indique ce qui est
touché, comment le reproduire et l'impact attendu. Accusé de réception sous 7 jours ; merci de laisser un
délai raisonnable pour corriger avant toute divulgation.

*Please report vulnerabilities privately through GitHub's "Report a vulnerability" button, never in a
public issue.*

## Périmètre

Dans le périmètre : les deux pages construites (`sigma52.html`, `SIGMA52-hors-ligne.html`), l'import des
historiques de mains (Winamax, GGPoker, archives PokerCraft) et des sauvegardes JSON, la partie en ligne
entre amis et les workflows de calcul (`.github/workflows/`).
Hors périmètre : la plateforme d'hébergement de la page publiée et les sites des salles de poker.

## Ce qui est déjà en place

- **Copie hors ligne sans aucune requête réseau**, polices comprises.
- **Historiques et sauvegardes importés traités comme non fiables** : lus comme du texte, jamais exécutés ;
  un format non reconnu est signalé à l'écran.
- **Progression locale** : en copie hors ligne, tout reste dans le navigateur ; l'export et l'import se
  font à la main (*Profil › Mes données*).
- **Workflows de calcul** sans secret : ils calculent la bibliothèque de flops et le modèle de la Table
  live, puis commitent les résultats sous l'identité `noreply` du dépôt.
- **Aucune aide en cours de main** : SIGMA 52 s'utilise hors table, conformément aux règles des salles.
