package com.shopjoy.ecadminapi.md.sg.repository;

import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgDownloadHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.md.sg.repository.qrydsl.QMdSgDownloadHistRepository;

public interface MdSgDownloadHistRepository extends JpaRepository<MdSgDownloadHist, String>, QMdSgDownloadHistRepository {
}
