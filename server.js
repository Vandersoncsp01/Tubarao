const express = require('express');
const path = require('path');
const fs = require('fs');
const YTDlpWrap = require('yt-dlp-wrap').default;
const app = express();

app.use(express.json());

const ytDlpWrap = new YTDlpWrap();

// Cria a pasta temporária de downloads se ela não existir
const downloadFolder = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder);
}

// Verifica e atualiza o motor de downloads ao iniciar
(async () => {
    try {
        console.log('Verificando motor de extração...');
        await YTDlpWrap.downloadFromGithub();
        console.log('Motor pronto para uso na qualidade máxima!');
    } catch (err) {
        console.error('Aviso ao baixar motor:', err.message);
    }
})();

// Abre a página principal (HTML)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota principal: Faz o download em qualidade máxima no servidor
app.post('/download', async (req, res) => {
    const videoUrl = req.body.url;

    if (!videoUrl) {
        return res.status(400).json({ error: 'URL não fornecida.' });
    }

    const fileName = 'video_hd_' + Date.now() + '.mp4';
    const outputPath = path.join(downloadFolder, fileName);

    try {
        console.log('Baixando mídia em altíssima resolução...');
        
        // Comando do motor focado em Full HD / Máxima Qualidade disponível
        await ytDlpWrap.execPromise([
            videoUrl,
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '-o', outputPath,
            '--no-check-certificates',
            '--no-warnings'
        ]);

        if (fs.existsSync(outputPath)) {
            console.log('Vídeo HD pronto para envio.');
            return res.json({ url: '/get-video?file=' + fileName });
        } else {
            throw new Error('Arquivo não foi gerado no servidor.');
        }

    } catch (error) {
        console.error('Erro no motor local:', error.message);
        return res.status(500).json({ error: 'Não foi possível baixar este link.' });
    }
});

// Rota que entrega o arquivo e limpa o espaço para não encher o servidor
app.get('/get-video', (req, res) => {
    const fileName = req.query.file;
    if (!fileName) return res.status(400).send('Arquivo não especificado.');

    const filePath = path.join(downloadFolder, fileName);

    if (fs.existsSync(filePath)) {
        res.download(filePath, 'video_full_hd.mp4', (err) => {
            if (!err) {
                try {
                    fs.unlinkSync(filePath);
                    console.log('Arquivo temporário limpo com sucesso.');
                } catch (e) {
                    console.error('Erro ao deletar arquivo:', e.message);
                }
            }
        });
    } else {
        res.status(404).send('Arquivo não encontrado.');
    }
});

// Configuração de Porta Automática para funcionar no PC e na Nuvem
const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
    console.log('==================================================');
    console.log(' Servidor rodando perfeitamente na porta: ' + port);
    console.log('==================================================');
});

