Weather Dashboard - Guia de Implementação

Este é um componente React "Single File" (arquivo único) que consome a API Open-Meteo para exibir previsões detalhadas de Itajaí e Balneário Camboriú.

1. Pré-requisitos

O projeto depende de React e Tailwind CSS. Ícones são fornecidos pela biblioteca lucide-react.

Instalação das dependências

Se estiver num projeto Vite/Next.js novo:

npm install lucide-react
# ou
yarn add lucide-react


2. Como Usar

Crie o arquivo WeatherComplete.jsx no seu diretório de componentes (ex: src/components/WeatherComplete.jsx).

Cole o código fornecido anteriormente.

Importe e utilize no seu App.jsx ou página principal:

import WeatherComplete from './components/WeatherComplete';

function App() {
  return (
    <div className="App">
      <WeatherComplete />
    </div>
  );
}


3. Funcionalidades da Interface

Navegação Superior

Botões de Local: Alternam instantaneamente entre "Prefeitura de Itajaí" e "Rua Bibiano Santos (BC)".

Header: Exibe temperatura atual, condição (ícone) e alertas críticos (tarjas laranjas) se houverem.

Gráficos Interativos (Tendência 12h)

Localizados no card central. Use os botões pequenos à direita para alternar a visualização:

☀️ Sol: Gráfico de área para temperatura (°C).

🌧️ Nuvem: Gráfico de barras para probabilidade de chuva (%).

💨 Vento: Gráfico de área para velocidade do vento (km/h).

Nota: As cores do gráfico e dos cards de resumo mudam conforme a aba selecionada (Laranja, Azul, Verde-água).

Lista Detalhada (Rodapé)

Tabela com rolagem vertical contendo dados hora a hora.

Destaques Visuais:

Vento > 25km/h: Texto laranja com fundo de alerta.

Chuva > 50%: Célula com fundo azul sólido.

4. API e Manutenção

Fonte de Dados: Open-Meteo API.

Custo: Gratuito para uso não comercial (até 10.000 requisições/dia).

Chave de API: Não requer API Key.

Atualização: Os dados são buscados toda vez que o componente é montado (useEffect) ou ao recarregar a página.

Desenvolvido para: Leandro (FullStack Web Developer)
