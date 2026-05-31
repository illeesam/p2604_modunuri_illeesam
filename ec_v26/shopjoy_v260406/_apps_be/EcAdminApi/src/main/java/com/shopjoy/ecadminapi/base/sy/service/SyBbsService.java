package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbsRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
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
public class SyBbsService {

    private final SyBbsRepository syBbsRepository;

    @PersistenceContext
    private EntityManager em;

    /* 게시판 게시물 키조회 */
    public SyBbsDto.Item getById(String id) {
        SyBbsDto.Item dto = syBbsRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyBbsDto.Item getByIdOrNull(String id) {
        return syBbsRepository.selectById(id).orElse(null);
    }

    /* 게시판 게시물 상세조회 */
    public SyBbs findById(String id) {
        return syBbsRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyBbs findByIdOrNull(String id) {
        return syBbsRepository.findById(id).orElse(null);
    }

    /* 게시판 게시물 키검증 */
    public boolean existsById(String id) {
        return syBbsRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syBbsRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 게시판 게시물 목록조회 */
    public List<SyBbsDto.Item> getList(SyBbsDto.Request req) {
        return syBbsRepository.selectList(req);
    }

    /* 게시판 게시물 페이지조회 */
    public SyBbsDto.PageResponse getPageData(SyBbsDto.Request req) {
        PageHelper.addPaging(req);
        return syBbsRepository.selectPageData(req);
    }

    /* 게시판 게시물 등록 */
    @Transactional
    public SyBbs create(SyBbs body) {
        body.setBbsId(CmUtil.generateId("sy_bbs"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyBbs saved = syBbsRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 게시판 게시물 수정 */
    @Transactional
    public SyBbs update(String id, SyBbs body) {
        CmUtil.requireId(id, "id", this);
        SyBbs entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "bbsId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBbs saved = syBbsRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 게시판 게시물 수정 */
    @Transactional
    public SyBbs updateSelective(SyBbs entity) {
        if (entity.getBbsId() == null) throw new CmBizException("bbsId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBbsId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBbsId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syBbsRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 게시판 게시물 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyBbs entity = findById(id);
        syBbsRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyBbs save(String cmd, SyBbs entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getBbsId() == null || entity.getBbsId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getBbsId() == null)
                    throw new CmBizException("삭제 대상 bbsId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syBbsRepository.existsById(entity.getBbsId()))
                    throw new CmBizException("존재하지 않는 SyBbs입니다: " + entity.getBbsId() + "::" + CmUtil.svcCallerInfo(this));
                syBbsRepository.deleteById(entity.getBbsId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setBbsId(CmUtil.generateId("sy_bbs"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyBbs saved = syBbsRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getBbsId() == null)
                    throw new CmBizException("수정 대상 bbsId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syBbsRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyBbs입니다: " + entity.getBbsId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getBbsId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyBbs> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyBbs row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getBbsId() == null || row.getBbsId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyBbs::getBbsId, "U", "bbsId", this);
            CmUtil.requireRowIds(rows, SyBbs::getBbsId, "D", "bbsId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyBbs::getBbsId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syBbsRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyBbs> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyBbs row : updateRows) {
                row.setUpdBy(authId);
                int affected = syBbsRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getBbsId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyBbs> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyBbs row : insertRows) {
                row.setBbsId(CmUtil.generateId("sy_bbs"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syBbsRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
