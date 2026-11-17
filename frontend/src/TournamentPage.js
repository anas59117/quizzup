import React from 'react';
import { Icon } from './ui';
import { DuelAction, ProgressionHeading, useProgressionCopy } from './ProgressionUI';

export default function TournamentPage({ onBack, onHome, onPlay }) {
  const { copy } = useProgressionCopy();
  return <main id="main-content" className="progression-page" aria-labelledby="progression-title" tabIndex={-1}>
    <ProgressionHeading title={copy('Tournois', 'Tournaments', 'Torneos')} eyebrow={copy('Le prochain défi', 'The next challenge', 'El próximo desafío')} onBack={onBack || onHome} />
    <div className="progression-layout">
      <section className="progression-card progression-feature">
        <span className="progression-badge"><Icon name="info" size={16} />{copy('En préparation', 'In preparation', 'En preparación')}</span>
        <Icon name="trophy" size={72} />
        <h2>{copy('Une nouvelle façon de se défier.', 'A new way to challenge each other.', 'Una nueva forma de competir.')}</h2>
        <p>{copy('Les tournois ne sont pas encore disponibles. Les inscriptions, le format et les récompenses seront annoncés ici lorsqu’ils seront prêts.', 'Tournaments are not available yet. Entries, format and rewards will be announced here when they are ready.', 'Los torneos aún no están disponibles. Las inscripciones, el formato y las recompensas se anunciarán aquí cuando estén listos.')}</p>
      </section>
      <section className="progression-card progression-aside">
        <span className="progression-eyebrow">{copy('En attendant', 'While you wait', 'Mientras tanto')}</span>
        <h2>{copy('Le duel est ouvert.', 'Duels are ready.', 'Los duelos están disponibles.')}</h2>
        <p>{copy('Choisis un thème et retrouve le plaisir d’un face-à-face.', 'Choose a topic and enjoy a head-to-head match.', 'Elige un tema y disfruta de un duelo.')}</p>
        <DuelAction onPlay={onPlay} />
        <p className="progression-note">{copy('Ce bouton lance un duel classique.', 'This button starts a regular duel.', 'Este botón inicia un duelo clásico.')}</p>
      </section>
    </div>
  </main>;
}
