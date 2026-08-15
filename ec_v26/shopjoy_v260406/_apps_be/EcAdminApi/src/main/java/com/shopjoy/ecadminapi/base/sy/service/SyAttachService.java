package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachChangeItem;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.repository.SyAttachRepository;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyAttachService {

    private final SyAttachRepository syAttachRepository;

    @PersistenceContext
    private EntityManager em;

    /* 첨부파일 키조회 */
    public SyAttachDto.Item getById(String id) {
        SyAttachDto.Item dto = syAttachRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyAttachDto.Item getByIdOrNull(String id) {
        return syAttachRepository.selectById(id).orElse(null);
    }

    /* 첨부파일 상세조회 */
    public SyAttach findById(String id) {
        return syAttachRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyAttach findByIdOrNull(String id) {
        return syAttachRepository.findById(id).orElse(null);
    }

    /* 첨부파일 키검증 */
    public boolean existsById(String id) {
        return syAttachRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syAttachRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 첨부파일 목록조회 */
    public List<SyAttachDto.Item> getList(SyAttachDto.Request req) {
        return syAttachRepository.selectList(req);
    }

    /* 첨부파일 페이지조회 */
    public BasePage<SyAttachDto.Item> getPageData(SyAttachDto.Request req) {
        PageHelper.addPaging(req);
        return syAttachRepository.selectPageData(req);
    }

    /* 첨부파일 등록 */
    @Transactional
    public SyAttach create(SyAttach body) {
        body.setAttachId(CmUtil.generateId("sy_attach"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyAttach saved = syAttachRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 첨부파일 수정 */
    @Transactional
    public SyAttach update(String id, SyAttach body) {
        CmUtil.requireId(id, "id", this);
        SyAttach entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "attachId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAttach saved = syAttachRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 첨부파일 수정 */
    @Transactional
    public SyAttach updateSelective(SyAttach entity) {
        if (entity.getAttachId() == null) throw new CmBizException("attachId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getAttachId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getAttachId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syAttachRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /**
     * 첨부파일 연계 변경사항(등록 시 추가 / 목록에서 삭제) 일괄 반영.
     *
     * <p>업로드·삭제 버튼 클릭은 화면에서 즉시 물리 반영되지만, sy_attach 의 ref_table_nm/ref_id
     * "연계" 자체는 이 메서드를 통해서만 반영된다 — 대상 레코드(공지/게시글/문의 등)를 저장하는
     * 업무 Service 의 create()/update() 가, 레코드 저장이 확정된 직후 같은 트랜잭션 안에서 호출해야
     * 한다. 별도 API 호출에 의존하면 그 호출이 누락되거나 실패했을 때 연계가 영구히 어긋나는 문제가
     * 있어(2026-08-15), 저장 주체가 되는 업무 Service 가 직접 호출하는 것을 표준으로 한다.</p>
     *
     * <p>rowStatus 'I' = ref_table_nm/ref_id 주입(연계), 'D' = 연계 삭제(물리 삭제 포함).
     * 'U'(부가정보 수정)는 아직 처리 항목이 없다 — 추후 보완.</p>
     *
     * @return 새로 연계된('I') 항목들을 fileSize/fileExt/storagePath/refTableNm/refId 까지 채워 반환.
     *         메일/카카오 알림톡 발송처럼 첨부 리소스 정보가 바로 필요한 후속 로직이 attachId 로
     *         다시 조회하지 않고 그대로 사용할 수 있다. 'D' 항목은 삭제되어 반환하지 않는다.
     */
    @Transactional
    public List<SyAttachChangeItem> applyChanges(List<SyAttachChangeItem> changes, String refTableNm, String refId) {
        List<SyAttachChangeItem> linked = new ArrayList<>();
        if (changes == null || changes.isEmpty()) return linked;
        if (refTableNm == null || refTableNm.isBlank() || refId == null || refId.isBlank())
            throw new CmBizException("refTableNm/refId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        for (SyAttachChangeItem c : changes) {
            if (c == null || c.getAttachId() == null || c.getAttachId().isBlank()) continue;
            if ("I".equals(c.getRowStatus())) {
                SyAttach patch = SyAttach.builder().attachId(c.getAttachId()).refTableNm(refTableNm).refId(refId).build();
                updateSelective(patch);
                SyAttach saved = findById(c.getAttachId());
                SyAttachChangeItem enriched = new SyAttachChangeItem();
                enriched.setAttachId(saved.getAttachId());
                enriched.setRowStatus("I");
                enriched.setFileSize(saved.getFileSize());
                enriched.setFileExt(saved.getFileExt());
                enriched.setStoragePath(saved.getStoragePath());
                enriched.setRefTableNm(refTableNm);
                enriched.setRefId(refId);
                linked.add(enriched);
            } else if ("D".equals(c.getRowStatus())) {
                delete(c.getAttachId());
            }
            // 'U' 예약 — 향후 부가정보(설명/정렬순서 등) 수정
        }
        return linked;
    }

    /* 첨부파일 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyAttach entity = findById(id);
        syAttachRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyAttach saveOneBase(SyAttach entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getAttachId());

        if ("D".equals(rowStatus)) {
            if (entity.getAttachId() == null)
                throw new CmBizException("삭제 대상 attachId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!syAttachRepository.existsById(entity.getAttachId()))
                throw new CmBizException("존재하지 않는 SyAttach입니다: " + entity.getAttachId() + "::" + CmUtil.svcCallerInfo(this));
            syAttachRepository.deleteById(entity.getAttachId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setAttachId(CmUtil.generateId("sy_attach"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            SyAttach saved = syAttachRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getAttachId() == null)
                throw new CmBizException("수정 대상 attachId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = syAttachRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 SyAttach입니다: " + entity.getAttachId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getAttachId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<SyAttach> rows) {
        /* 0단계: rowStatus 정규화 */
        for (SyAttach row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getAttachId() == null || row.getAttachId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, SyAttach::getAttachId, "U", "attachId", this);
        CmUtil.requireRowIds(rows, SyAttach::getAttachId, "D", "attachId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(SyAttach::getAttachId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syAttachRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<SyAttach> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (SyAttach row : updateRows) {
            row.setUpdBy(authId);
            int affected = syAttachRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getAttachId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<SyAttach> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyAttach row : insertRows) {
            row.setAttachId(CmUtil.generateId("sy_attach"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syAttachRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
