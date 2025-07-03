// Max amount of scrapes per run (bc it costs money)
const SCRAPE_LIMIT = 100;

/* ================ [ IMPORTS ] ================ */

import { tiktok, supabase, openai } from "../util/clients.js";
import axios from "axios";

/* ================ [ HELPERS ] ================ */

function getUsername(url) {
    const match = url.match(/tiktok\.com\/@([^\/?#]+)/i);
    return match ? match[1] : null;
}

function hasAgency(email) {
    const agencies = [
        'audiencly.com','clovertalent.gg','puka.agency','xpinfluence.com',
        'bossmgmtgrp.com','apollomgmt.co','viralnation.com','mythictalent.com',
        'manatalentgroup.com','amg.gg','blackbulb.com','night.co',
        'orbital-management.com','skygate.media','intheblackmedia.com',
        'jokullmanagement.com','elusive-agency.com','slogansocial.com',
        'ggtalentgroup.com','novo.tv','hypefactorytalent.com','ellify.com',
        'ellify360.com','clickmgmt.com.au','grail-talent.com','moreyellow.com',
        'rightclick.gg','caa.com','pbnj.gg','ace-creators.com',
        'evolved.gg','a2zinfluencers.com','kaizentalent.co','afkcreators.com',
        '28thave.com','blackshore.com','loaded.gg','elktalent.com'
    ];
    return agencies.includes(email.split("@")[1]);
}

/* ================ [ PROCESSOR ] ================ */

const { data } = await supabase
    .from("tiktok_data")
    .select("url, email")
    .eq("todo", true);

const creators = data.slice(0, SCRAPE_LIMIT);

for (const creator of creators) {
    const username = getUsername(creator.url);

    try {
        const config = {
            profiles: [username],
            resultsPerPage: 3,
            excludePinnedPosts: true,
            profileSorting: "latest"
        };

        const res = await axios.post(tiktok, config);
        const data = res.data;

        if (!Array.isArray(data) || data.length === 0) continue;

        const avg_views = Math.round(
            data.reduce((sum, vid) => sum + (vid.playCount || 0), 0) / data.length
        );

        const last_upload = data[0].createTimeISO?.split("T")[0] || null;
        
        const profile = data[0].authorMeta;

        const videos = data.map(v => {
            const { authorMeta, ...rest } = v;
            return rest;
        });

        const titles = videos.map(v => v.text).filter(Boolean);

        let english_only = false;

        try {
            const english = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a language detection tool. Answer with only true or false."
                    },
                    {
                        role: "user",
                        content: `Here are 3 video titles:\n\n${titles.join("\n")}\n\nIs this creator likely English speaking?`
                    }
                ]
            });

            console.log(JSON.stringify(english, null, 2));

            english_only = english.choices[0].message.content.trim().toLowerCase().includes("true");
        } catch (error) {
            console.error("OpenAI error:", error.response?.data || error.message);
            throw error;
        }

        const update = {
            email: creator.email,
            updated_at: new Date().toISOString(),
            todo: false,
            avg_views,
            last_upload,
            has_agency: hasAgency(creator.email),
            english_only,
            profile,
            video1: videos[0],
            video2: videos[1] ?? null,
            video3: videos[2] ?? null
        };

        const { error } = await supabase
            .from("tiktok_data")
            .upsert({
                url: creator.url,
                ...update
            }, { onConflict: 'url' });

        if (error) {
            console.error(`Supabase error for ${username}:`, error);
            throw error;
        }
    } catch (error) {
        console.error(`Error scraping ${username}:`, error.response?.data || error.message);
        throw error;
    }
}