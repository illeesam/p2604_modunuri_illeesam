package com.shopjoy.ecBeBo.md.sg.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.md.sg.data.dto.MdSgProjectDto;
import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgProject;
import com.shopjoy.ecBeBo.md.sg.repository.MdSgSourcegenRepository;
import com.shopjoy.ecBeBo.md.sg.repository.MdSgSourcegenHistRepository;
import com.shopjoy.ecBeBo.md.sg.repository.MdSgProjectRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MdSgProjectService {

    private final MdSgProjectRepository mdSgProjectRepository;
    private final MdSgSourcegenRepository mdSgSourcegenRepository;
    private final MdSgSourcegenHistRepository mdSgSourcegenHistRepository;

    @PersistenceContext
    private EntityManager em;

    public MdSgProjectDto.Item getById(String id) {
        // [QueryDSL] 소스젠 프로젝트 마스터 — DDL 묶음 단위 단건 조회
        MdSgProjectDto.Item dto = mdSgProjectRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    public MdSgProject findById(String id) {
        // [쿼리 메서드] 소스젠 프로젝트 마스터 — DDL 묶음 단위 단건 조회
        return mdSgProjectRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    public boolean existsById(String id) {
        // [쿼리 메서드] 소스젠 프로젝트 마스터 — DDL 묶음 단위 존재 여부 확인
        return mdSgProjectRepository.existsById(id);
    }

    public List<MdSgProjectDto.Item> getList(MdSgProjectDto.Request req) {
        // [QueryDSL] 소스젠 프로젝트 마스터 — DDL 묶음 단위 목록 조회
        return mdSgProjectRepository.selectList(req);
    }

    public BasePage<MdSgProjectDto.Item> getPageData(MdSgProjectDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 소스젠 프로젝트 마스터 — DDL 묶음 단위 페이지 조회
        return mdSgProjectRepository.selectPageData(req);
    }

    @Transactional
    public MdSgProject create(MdSgProject body) {
        body.setProjectId(CmUtil.generateId("sg_project"));
        if (body.getProjectStatusCd() == null) body.setProjectStatusCd("DRAFT");
        if (body.getDbTypeCd() == null) body.setDbTypeCd("POSTGRESQL");
        if (body.getUseYn() == null) body.setUseYn("Y");
        body.setMemberId(SecurityUtil.getAuthUser().authId()); // 작성자 — 목록 화면 작성자 검색(memberNm 조인)이 이 값을 사용
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 소스젠 프로젝트 마스터 — DDL 묶음 단위 저장
        MdSgProject saved = mdSgProjectRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public MdSgProject update(String id, MdSgProject body) {
        CmUtil.requireId(id, "id", this);
        MdSgProject entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "projectId^memberId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 소스젠 프로젝트 마스터 — DDL 묶음 단위 저장
        MdSgProject saved = mdSgProjectRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** delete — 프로젝트 + 하위 DDL 탭 + 생성 이력을 함께 정리한다(고아 행 방지) */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MdSgProject entity = findById(id);
        // [쿼리 메서드] 프로젝트 DDL 탭 전체 삭제
        mdSgSourcegenRepository.deleteByProjectId(id);
        // [쿼리 메서드] 프로젝트 생성이력 전체 삭제
        mdSgSourcegenHistRepository.deleteByProjectId(id);
        // [쿼리 메서드] 소스젠 프로젝트 마스터 — DDL 묶음 단위 삭제
        mdSgProjectRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** syncDdlCount — DDL 탭 저장 후 프로젝트의 집계 캐시 컬럼을 실제 건수로 맞춘다 */
    @Transactional
    public void syncDdlCount(String projectId) {
        CmUtil.requireId(projectId, "projectId", this);
        MdSgProject entity = findById(projectId);
        // [쿼리 메서드] 소스젠 DDL 정의 — 프로젝트당 여러 테이블 DDL 보관 건수 조회
        entity.setDdlCount((int) mdSgSourcegenRepository.countByProjectId(projectId));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 소스젠 프로젝트 마스터 — DDL 묶음 단위 저장
        mdSgProjectRepository.save(entity);
        em.flush();
    }

    /** markGenerated — 소스 생성 성공 시 마지막 생성 일시/파일수/상태를 갱신 */
    @Transactional
    public void markGenerated(String projectId, Integer fileCount) {
        CmUtil.requireId(projectId, "projectId", this);
        MdSgProject entity = findById(projectId);
        entity.setLastGenDate(LocalDateTime.now());
        entity.setLastFileCount(fileCount);
        entity.setProjectStatusCd("DONE");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 소스젠 프로젝트 마스터 — DDL 묶음 단위 저장
        mdSgProjectRepository.save(entity);
        em.flush();
    }
}
