package com.shopjoy.ecadminapi.md.sg.repository;

import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgProject;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.md.sg.repository.qrydsl.QMdSgProjectRepository;

public interface MdSgProjectRepository extends JpaRepository<MdSgProject, String>, QMdSgProjectRepository {
}
