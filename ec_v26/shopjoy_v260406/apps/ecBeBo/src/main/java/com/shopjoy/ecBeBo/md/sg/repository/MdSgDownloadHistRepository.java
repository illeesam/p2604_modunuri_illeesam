package com.shopjoy.ecBeBo.md.sg.repository;

import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgDownloadHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.md.sg.repository.qrydsl.QMdSgDownloadHistRepository;

public interface MdSgDownloadHistRepository extends JpaRepository<MdSgDownloadHist, String>, QMdSgDownloadHistRepository {
}
