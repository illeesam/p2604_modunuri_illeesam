package com.shopjoy.ecBeBo.md.sg.repository;

import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgProject;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.md.sg.repository.qrydsl.QMdSgProjectRepository;

public interface MdSgProjectRepository extends JpaRepository<MdSgProject, String>, QMdSgProjectRepository {
}
