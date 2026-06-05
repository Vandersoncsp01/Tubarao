const express = require('express');
const path = require('path');
const fs = require('fs');
const YTDlpWrap = require('yt-dlp-wrap').default;
const app = express();

app.use(express.json());

// Configura a pasta correta de cache e downloads permitida pelo Render
const baseFolder = process.env.XDG_CACHE_HOME || __dirname;
const downloadFolder = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
}

const ytDlpPath = path.join(baseFolder, 'yt-dlp');

// Função para iniciar o servidor apenas quando o motor estiver pronto
async function startServer() {
    try {
        console.log('Verificando motor de mídia na nuvem...');
        if (!fs.existsSync(ytDlpPath)) {
            console.log('Baixando executável yt-dlp oficial do GitHub...');
            await YTDlpWrap.downloadFromGithub(ytDlpPath);
            fs.chmodSync(ytDlpPath, '755'); // Dá permissão de execução no Linux
            console.log('Motor de mídia baixado e instalado com sucesso!');
        } else {
            console.log('Motor de mídia já pronto no cache.');
        }

        // Liga o servidor apenas após o motor estar garantido na pasta
        const port = process.env.PORT || 3000;
        app.listen(port, '0.0.0.0', () => {
            console.log('==================================================');
            console.log(' Servidor estável e pronto na porta: ' + port);
            console.log('==================================================');
        });

    } catch (err) {
        console.error('Erro crítico ao preparar motor na nuvem:', err.message);
        // Tenta ligar mesmo com erro para o Render não derrubar a instância
        const port = process.env.PORT || 3000;
        app.listen(port, '0.0.0.0', () => {
            console.log('Servidor iniciado em modo de segurança na porta: ' + port);
        });
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/download', async (req, res) => {
    const videoUrl = req.body.url;

    if (!videoUrl) {
        return res.status(400).json({ error: 'URL não fornecida.' });
    }

    const fileName = 'video_hd_' + Date.now() + '.mp4';
    const outputPath = path.join(downloadFolder, fileName);

    try {
        console.log('Processando extração de mídia na nuvem...');
        
        if (!fs.existsSync(ytDlpPath)) {
            return res.status(500).json({ error: 'O motor ainda está inicializando no servidor. Aguarde 10 segundos.' });
        }

        const ytDlpWrap = new YTDlpWrap(ytDlpPath);
        
        await ytDlpWrap.execPromise([
            videoUrl,
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '-o', outputPath,
            '--no-check-certificates',
            '--no-warnings'
        ]);

        if (fs.existsSync(outputPath)) {
            console.log('Mídia decodificada e pronta.');
            return res.json({ url: '/get-video?file=' + fileName });
        } else {
            throw new Error('Arquivo não gerado.');
        }

    } catch (error) {
        console.error('Erro na extração:', error.message);
        return res.status(500).json({ error: 'Não foi possível processar este link.' });
    }
});

app.get('/get-video', (req, res) => {
    const fileName = req.query.file;
    if (!fileName) return res.status(400).send('Arquivo inválido.');

    const filePath = path.join(downloadFolder, fileName);

    if (fs.existsSync(filePath)) {
        res.download(filePath, 'video_premium.mp4', (err) => {
            if (!err) {
                try {
                    fs.unlinkSync(filePath);
                } catch (e) {
                    console.error('Erro de limpeza:', e.message);
                }
            }
        });
    } else {
        res.status(404).send('Arquivo expirado ou não encontrado.');
    }
});

// Executa o início planejado
startServer();
